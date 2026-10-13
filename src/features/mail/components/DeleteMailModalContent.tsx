import React, { useState } from 'react';
import { Trash, WarningCircle } from '@phosphor-icons/react';
import { MailAccountItem } from '../types/mail.types';

interface DeleteMailModalContentProps {
  account: MailAccountItem;
  onCancel: () => void;
  onConfirmDelete: (accountId: string) => Promise<void>;
}

export const DeleteMailModalContent: React.FC<DeleteMailModalContentProps> = ({
  account,
  onCancel,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setErrorMessage(null);
    setIsDeleting(true);
    try {
      await onConfirmDelete(account.id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete email.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Warning Banner */}
      <div className="rounded-lg bg-elevated border border-default p-3 space-y-2">
        <p className="text-xs text-fg-secondary leading-relaxed">
          Are you sure you want to delete this email address? This will permanently remove the
          routing rule from Cloudflare Email Routing and OneVault storage.
        </p>
        <div className="rounded-md bg-surface-solid border border-subtle px-2.5 py-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-fg-muted leading-none">Target</span>
          <span className="font-mono text-xs font-semibold text-fg-primary truncate leading-none">
            {account.email}
          </span>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-md border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isDeleting}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-danger text-white hover:opacity-90 px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
        >
          <Trash size={13} weight="bold" />
          <span className="leading-none">
            {isDeleting ? 'Deleting...' : 'Continue Delete'}
          </span>
        </button>
      </div>
    </div>
  );
};
