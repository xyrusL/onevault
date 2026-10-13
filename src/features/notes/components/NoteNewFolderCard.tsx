import React from 'react';
import { FolderPlus } from '@phosphor-icons/react';

interface NoteNewFolderCardProps {
  onClick: () => void;
}

export const NoteNewFolderCard: React.FC<NoteNewFolderCardProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-default hover:border-accent/60 bg-surface/40 hover:bg-elevated/40 p-4 transition-all duration-200 cursor-pointer min-w-36 sm:min-w-44 h-36 text-center"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-elevated group-hover:bg-accent group-hover:text-accent-fg border border-default text-fg-secondary transition-colors mb-2 shadow-xs">
        <FolderPlus size={18} weight="bold" />
      </div>
      <span className="text-xs font-semibold text-fg-secondary group-hover:text-fg-primary transition-colors">
        New folder
      </span>
    </button>
  );
};
