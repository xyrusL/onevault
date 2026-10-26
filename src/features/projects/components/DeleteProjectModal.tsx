import React from 'react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { Trash, WarningCircle } from '@phosphor-icons/react';
import type { ProjectItem } from '../types/projects.types';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  project: ProjectItem | null;
  isProcessing?: boolean;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  project,
  isProcessing = false,
}) => {
  if (!project) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project Gateway"
      subtitle={`Confirm permanent removal of ${project.name}`}
      icon={<Trash size={18} weight="duotone" className="text-danger" />}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 flex items-start gap-2.5 text-danger">
          <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-fg-primary">
              This action cannot be undone
            </p>
            <p className="text-[11px] text-fg-muted leading-relaxed">
              Removing <strong>{project.name}</strong> will delete its D1 gateway configuration and revoke its Project Gateway Token. Any site attempting to communicate via this slug will be rejected.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-default hover:bg-surface text-fg-secondary cursor-pointer font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-lg bg-danger hover:bg-danger/90 text-white font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
