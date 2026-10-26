import React from 'react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { Power, Warning } from '@phosphor-icons/react';
import type { ProjectItem } from '../types/projects.types';

interface UnplugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnplug: () => void;
  project: ProjectItem | null;
  isProcessing?: boolean;
}

export const UnplugModal: React.FC<UnplugModalProps> = ({
  isOpen,
  onClose,
  onConfirmUnplug,
  project,
  isProcessing = false,
}) => {
  if (!project) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Unplug Project Protection?"
      subtitle={`Temporarily pause OneVault edge shield for ${project.name}`}
      icon={<Power size={18} weight="bold" className="text-amber-400" />}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-fg-secondary">
          <Warning size={16} weight="duotone" className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-fg-primary">
              Edge protection will be temporarily bypassed
            </p>
            <p className="text-[11px] text-fg-muted leading-relaxed">
              When unplugged, <strong>{project.name}</strong> will switch to direct unshielded streaming. Anti-bot scraper scrubbers, stream HMAC tokenization, and API concealment will be paused until you plug it back in.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-fg-secondary leading-relaxed">
          Your project configuration and upstream secrets remain securely stored in D1. You can re-enable protection at any time with a single click.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-default hover:bg-surface text-fg-secondary cursor-pointer font-semibold transition-colors"
          >
            Keep Protected
          </button>
          <button
            type="button"
            onClick={onConfirmUnplug}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Unplugging...' : 'Unplug Protection'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
