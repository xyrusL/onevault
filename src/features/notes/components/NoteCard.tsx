import React, { useState } from 'react';
import {
  Archive,
  Clock,
  CornersOut,
  DotsThree,
  FolderSimple,
  PencilSimple,
  PushPin,
  Tag,
  Trash,
} from '@phosphor-icons/react';
import { Note } from '../types/notes.types';
import { getNoteColorTheme } from '../utils/note-colors.utils';
import { NoteContentRenderer } from './NoteContentRenderer';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onOpenFullView?: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
  onFilterByFolder?: (folderId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onOpenFullView,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onFilterByFolder,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = getNoteColorTheme(note.color);

  const updatedDate = new Date(note.updatedAt);
  const formattedDate = updatedDate.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = updatedDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  });

  return (
    <div
      onClick={() => onEdit(note)}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer min-h-64 ${
        theme.cardClass
      } hover:shadow-md hover:-translate-y-0.5`}
    >
      {/* Top Header: Date, Pin Button, Edit Quick Icon, and 3-dots Menu */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-current/10">
          <span className="font-mono text-[11px] font-semibold opacity-75">
            {formattedDate}
          </span>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => onTogglePin(note)}
              title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors cursor-pointer ${
                note.isPinned
                  ? 'bg-black/15 dark:bg-white/20 text-current'
                  : 'opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <PushPin
                size={13}
                weight={note.isPinned ? 'fill' : 'bold'}
                className={note.isPinned ? 'rotate-45' : ''}
              />
            </button>

            {/* Quick Edit */}
            <button
              type="button"
              onClick={() => onEdit(note)}
              title="Edit note"
              className="flex h-6 w-6 items-center justify-center rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PencilSimple size={13} weight="bold" />
            </button>

            {/* Quick Full View Canvas */}
            {onOpenFullView && (
              <button
                type="button"
                onClick={() => onOpenFullView(note)}
                title="Open in Full View Canvas (Graphs & Media Embeds)"
                className="flex h-6 w-6 items-center justify-center rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CornersOut size={13} weight="bold" />
              </button>
            )}

            {/* Context Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="More options"
                className="flex h-6 w-6 items-center justify-center rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <DotsThree size={16} weight="bold" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 z-40 w-36 rounded-xl bg-surface-solid border border-default p-1 shadow-card text-xs text-fg-primary">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleArchive(note);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-fg-secondary hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer"
                    >
                      <Archive size={14} />
                      <span>{note.isArchived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(note);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    >
                      <Trash size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Note Title */}
        <h3 className="font-display text-sm font-bold pt-2.5 pb-1 leading-snug line-clamp-2">
          {note.title}
        </h3>

        {/* Note Formatted Preview */}
        <div className="pt-1 pb-3">
          <NoteContentRenderer content={note.content} maxLines={5} />
        </div>
      </div>

      {/* Bottom Metadata: Timestamp, Folder, Tags */}
      <div className="pt-2 border-t border-current/10 space-y-2">
        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium"
              >
                <Tag size={10} />
                <span>{tag}</span>
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] opacity-60">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] opacity-75 font-medium">
          {/* Timestamp */}
          <span className="inline-flex items-center gap-1">
            <Clock size={12} weight="bold" />
            <span>{formattedTime}</span>
          </span>

          {/* Folder badge: shows folder name or None */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onFilterByFolder) {
                onFilterByFolder(note.folderId || '__none__');
              }
            }}
            className="inline-flex items-center gap-1 rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium hover:bg-black/20 dark:hover:bg-white/20 transition-colors cursor-pointer"
          >
            <FolderSimple size={11} weight={note.folderName ? 'fill' : 'regular'} />
            <span className="truncate max-w-24">{note.folderName || 'None'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
