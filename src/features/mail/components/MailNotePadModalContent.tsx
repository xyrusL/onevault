import React, { useState } from 'react';
import { Check, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { MailAccountItem, UpdateMailPayload } from '../types/mail.types';

interface MailNotePadModalContentProps {
  account: MailAccountItem;
  onClose: () => void;
  onUpdate: (accountId: string, payload: UpdateMailPayload) => Promise<void>;
}

export const MailNotePadModalContent: React.FC<MailNotePadModalContentProps> = ({
  account,
  onClose,
  onUpdate,
}) => {
  const [note, setNote] = useState(account.note);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasChanges = note.trim() !== account.note.trim();

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasChanges) {
      onClose();
      return;
    }

    setErrorMessage(null);
    setIsBusy(true);
    try {
      await onUpdate(account.id, {
        forwardTo: account.forwardTo,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-fg-muted leading-relaxed">
          Write extended notes, sentences, instructions, or documentation for this address:
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={10}
          placeholder="Type your notes or sentences here..."
          className="w-full rounded-lg bg-input hover:bg-input-hover focus:bg-surface-solid p-3.5 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none resize-y leading-relaxed font-sans min-h-[220px]"
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-subtle">
        <span className="text-[11px] font-mono text-fg-muted">
          {note.length} characters{note.trim() ? ` · ${note.trim().split(/\s+/).length} words` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="inline-flex items-center justify-center rounded-md border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isBusy ? (
              <CircleNotch size={13} weight="bold" className="animate-spin" />
            ) : (
              <Check size={13} weight="bold" />
            )}
            <span>{hasChanges ? 'Save' : 'Done'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
