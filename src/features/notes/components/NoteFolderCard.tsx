import React, { useState } from 'react';
import {
  DotsThree,
  FilmSlate,
  Folder,
  GraduationCap,
  Books,
  PencilSimple,
  Trash,
  Key,
  MusicNotes,
  Heart,
  Star,
} from '@phosphor-icons/react';
import { NoteFolder } from '../types/notes.types';
import { getFolderTheme } from '../utils/note-colors.utils';

interface NoteFolderCardProps {
  folder: NoteFolder;
  isSelected?: boolean;
  onSelect: (folder: NoteFolder) => void;
  onEdit: (folder: NoteFolder) => void;
  onDelete: (folder: NoteFolder) => void;
}

function getFolderIcon(icon?: string | null) {
  switch (icon) {
    case 'film-slate':
      return <FilmSlate size={18} weight="duotone" />;
    case 'graduation-cap':
      return <GraduationCap size={18} weight="duotone" />;
    case 'books':
      return <Books size={18} weight="duotone" />;
    case 'key':
      return <Key size={18} weight="duotone" />;
    case 'music':
      return <MusicNotes size={18} weight="duotone" />;
    case 'heart':
      return <Heart size={18} weight="duotone" />;
    case 'star':
      return <Star size={18} weight="duotone" />;
    default:
      return <Folder size={18} weight="duotone" />;
  }
}

export const NoteFolderCard: React.FC<NoteFolderCardProps> = ({
  folder,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = getFolderTheme(folder.color);

  // Format date like mockup (e.g. 12/12/2021 or readable date)
  const formattedDate = new Date(folder.updatedAt).toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(folder)}
      className={`group relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 cursor-pointer min-w-48 sm:min-w-56 h-36 border ${
        theme.bgClass
      } ${
        isSelected
          ? `${theme.selectedBorderClass}`
          : 'border-transparent hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Top Row: Icon Container and 3-dots Menu */}
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 dark:bg-white/15 shadow-xs">
          {getFolderIcon(folder.icon)}
        </div>

        {folder.id !== '__none__' && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Folder actions"
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
            >
              <DotsThree size={20} weight="bold" />
            </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-40 w-36 rounded-xl bg-surface-solid border border-default p-1 shadow-card text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(folder);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-fg-secondary hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer"
                >
                  <PencilSimple size={14} />
                  <span>Edit Folder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(folder);
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
      )}
    </div>

      {/* Bottom Info: Folder Title and Date / Note Count */}
      <div className="min-w-0">
        <h3 className="font-display text-sm font-bold truncate leading-tight">
          {folder.name}
        </h3>
        <div className="flex items-center justify-between text-[11px] opacity-75 mt-1 font-medium">
          <span>{formattedDate}</span>
          <span>
            {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </div>
    </div>
  );
};
