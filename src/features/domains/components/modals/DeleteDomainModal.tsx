import React, { useState } from 'react';
import { CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import type { DomainItem } from '../../types/domains.types';

interface DeleteDomainModalProps {
  isOpen: boolean;
  domain: DomainItem | null;
  onClose: () => void;
  onConfirm: (domain: DomainItem) => Promise<void>;
}

export const DeleteDomainModal: React.FC<DeleteDomainModalProps> = ({
  isOpen,
  domain,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!domain) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(domain);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete domain.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Domain"
      subtitle={`Are you sure you want to remove ${domain.name}?`}
      icon={<WarningCircle size={18} weight="fill" className="text-danger" />}
      maxWidthClass="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isDeleting && <CircleNotch size={13} weight="bold" className="animate-spin" />}
            <span>{isDeleting ? 'Removing...' : 'Delete Domain'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-fg-secondary leading-relaxed">
          This will permanently unregister <strong className="text-fg-primary font-mono">{domain.name}</strong> from OneVault and delete all associated subdomains and DNS records.
        </p>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
          Website visitors will no longer be routed to your subdomains or web servers once the zone is removed.
        </div>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 p-2.5 text-xs text-danger font-medium">
            {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
