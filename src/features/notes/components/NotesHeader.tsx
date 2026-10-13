import React from 'react';
import {
  CornersOut,
  FolderPlus,
  MagnifyingGlass,
  Plus,
  X,
} from '@phosphor-icons/react';

interface NotesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onOpenFullViewCanvas?: () => void;
  totalNotesCount: number;
}

export const NotesHeader: React.FC<NotesHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCreateNote,
  onCreateFolder,
  onOpenFullViewCanvas,
  totalNotesCount,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-surface border border-default rounded-xl p-3.5 shadow-card">
      {/* Title & Pill */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-fg-primary uppercase">
              My Notes
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-elevated border border-default text-fg-secondary">
              {totalNotesCount} {totalNotesCount === 1 ? 'note' : 'notes'}
            </span>
          </div>
          <p className="text-[11px] text-fg-muted mt-0.5">
            Encrypted vault notes, formatted checklists, and folder organization.
          </p>
        </div>
      </div>

      {/* Center/Search Bar */}
      <div className="flex-1 max-w-md w-full relative">
        <div className="relative flex items-center">
          <MagnifyingGlass
            size={15}
            weight="bold"
            className="absolute left-3 text-fg-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, checklists, tags..."
            className="w-full rounded-xl border border-default bg-elevated/70 hover:bg-elevated focus:bg-surface-solid pl-9 pr-8 py-2 text-xs text-fg-primary placeholder:text-fg-placeholder transition-colors focus:outline-none focus:border-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-fg-muted hover:text-fg-primary p-0.5 rounded cursor-pointer"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons: New Folder, Full Canvas & New Note */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCreateFolder}
          className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-elevated hover:bg-surface-solid text-fg-secondary hover:text-fg-primary px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <FolderPlus size={15} weight="duotone" className="text-accent" />
          <span>New Folder</span>
        </button>

        {onOpenFullViewCanvas && (
          <button
            type="button"
            onClick={onOpenFullViewCanvas}
            title="Open Full Screen Note Canvas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-elevated hover:bg-surface-solid text-fg-secondary hover:text-fg-primary px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <CornersOut size={15} weight="duotone" className="text-accent" />
            <span className="hidden sm:inline">Full Canvas</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCreateNote}
          className="group inline-flex items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus
            size={14}
            weight="bold"
            className="transition-transform group-hover:rotate-90"
          />
          <span>New Note</span>
        </button>
      </div>
    </header>
  );
};
