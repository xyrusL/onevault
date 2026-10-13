import React, { useState } from 'react';
import { CircleNotch, Trash, Warning } from '@phosphor-icons/react';
import { NoteFolder } from '../types/notes.types';

interface DeleteFolderModalContentProps {
  folder: NoteFolder;
  onCancel: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteFolderModalContent: React.FC<DeleteFolderModalContentProps> = ({
  folder,
  onCancel,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(folder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs text-danger font-medium"
        >
          {error}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl bg-danger/10 border border-danger/20 p-3.5 text-xs text-danger leading-relaxed">
        <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
        <span>
          Are you sure you want to delete folder &quot;{folder.name}&quot;? Notes in this folder will remain in your vault under general notes.
        </span>
      </div>

      <div className="rounded-xl bg-elevated/70 border border-default p-3.5 text-xs space-y-1">
        <span className="font-semibold text-fg-primary block text-sm">
          {folder.name}
        </span>
        <span className="text-fg-muted block">
          Contains {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-danger hover:bg-danger-hover text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
        >
          {isDeleting ? (
            <>
              <CircleNotch size={14} weight="bold" className="animate-spin" />
              <span>Deleting Folder...</span>
            </>
          ) : (
            <>
              <Trash size={14} weight="bold" />
              <span>Delete Folder</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
