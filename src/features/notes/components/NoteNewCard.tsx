import React from 'react';
import { NotePencil } from '@phosphor-icons/react';

interface NoteNewCardProps {
  onClick: () => void;
}

export const NoteNewCard: React.FC<NoteNewCardProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-default hover:border-accent/60 bg-surface/40 hover:bg-elevated/40 p-6 transition-all duration-200 cursor-pointer min-h-64 text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated group-hover:bg-accent group-hover:text-accent-fg border border-default text-fg-secondary transition-colors mb-2.5 shadow-xs">
        <NotePencil size={20} weight="bold" />
      </div>
      <span className="text-xs font-semibold text-fg-secondary group-hover:text-fg-primary transition-colors">
        New Note
      </span>
      <span className="text-[11px] text-fg-muted mt-0.5">
        Click to create
      </span>
    </button>
  );
};
