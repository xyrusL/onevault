import React, { useState } from 'react';
import {
  Books,
  Check,
  CircleNotch,
  FilmSlate,
  Folder,
  GraduationCap,
  Heart,
  Key,
  MusicNotes,
  Star,
} from '@phosphor-icons/react';
import { CreateFolderPayload, NoteFolder, UpdateFolderPayload } from '../types/notes.types';
import { FOLDER_COLOR_OPTIONS } from '../utils/note-colors.utils';

interface FolderEditorModalContentProps {
  folder?: NoteFolder | null;
  onCancel: () => void;
  onSave: (payload: CreateFolderPayload | UpdateFolderPayload) => Promise<void>;
}

const FOLDER_ICON_OPTIONS = [
  { id: 'folder', label: 'Default Folder', icon: <Folder size={18} weight="duotone" /> },
  { id: 'film-slate', label: 'Film & Media', icon: <FilmSlate size={18} weight="duotone" /> },
  { id: 'graduation-cap', label: 'Study & Classes', icon: <GraduationCap size={18} weight="duotone" /> },
  { id: 'books', label: 'Books & Reading', icon: <Books size={18} weight="duotone" /> },
  { id: 'key', label: 'Vault Keys & Auth', icon: <Key size={18} weight="duotone" /> },
  { id: 'music', label: 'Audio & Music', icon: <MusicNotes size={18} weight="duotone" /> },
  { id: 'heart', label: 'Personal & Health', icon: <Heart size={18} weight="duotone" /> },
  { id: 'star', label: 'Important & Starred', icon: <Star size={18} weight="duotone" /> },
];

export const FolderEditorModalContent: React.FC<FolderEditorModalContentProps> = ({
  folder,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(folder?.name ?? '');
  const [color, setColor] = useState(folder?.color ?? 'purple');
  const [icon, setIcon] = useState(folder?.icon ?? 'folder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a folder name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        color,
        icon,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save folder.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs text-danger font-medium"
        >
          {error}
        </div>
      )}

      {/* Folder Name */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wider block">
          Folder Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Movie Review, Class Notes, Book Lists"
          autoFocus
          className="w-full rounded-xl border border-default bg-elevated/60 px-3 py-2 text-xs text-fg-primary placeholder:text-fg-placeholder focus:outline-none focus:border-accent"
        />
      </div>

      {/* Color Selection (color-only swatches) */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wider block">
          Folder Theme Color
        </label>
        <div className="grid grid-cols-8 gap-2">
          {FOLDER_COLOR_OPTIONS.map((c) => {
            const isSelected = color === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                title={c.label}
                aria-label={c.label}
                className={`flex h-10 w-full items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  c.bgClass
                } ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent/30 scale-[1.03]'
                    : 'border-transparent hover:opacity-90 hover:scale-[1.03]'
                }`}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: c.dotColor }}
                >
                  {isSelected && (
                    <Check size={12} weight="bold" className="text-white drop-shadow-2xs" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wider block">
          Folder Icon
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {FOLDER_ICON_OPTIONS.map((opt) => {
            const isSelected = icon === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setIcon(opt.id)}
                title={opt.label}
                className={`flex h-10 w-full items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent text-accent-fg border-accent shadow-xs'
                    : 'bg-elevated/60 border-default text-fg-secondary hover:text-fg-primary hover:bg-elevated'
                }`}
              >
                {opt.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-4 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
        >
          {isSubmitting ? (
            <>
              <CircleNotch size={14} weight="bold" className="animate-spin" />
              <span>Saving Folder...</span>
            </>
          ) : (
            <span>{folder ? 'Save Changes' : 'Create Folder'}</span>
          )}
        </button>
      </div>
    </form>
  );
};
