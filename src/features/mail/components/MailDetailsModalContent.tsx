import React, { useMemo, useState } from 'react';
import {
  ArrowBendUpRight,
  CalendarBlank,
  Check,
  CircleNotch,
  Clock,
  CornersOut,
  FileText,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals';
import { CustomSelect, SelectOption } from '../../../shared/components/forms';
import {
  ForwardTarget,
  isVaultDestination,
  MailAccountItem,
  NO_FORWARD,
  UpdateMailPayload,
} from '../types/mail.types';

interface MailDetailsModalContentProps {
  account: MailAccountItem;
  forwardTargets: ForwardTarget[];
  onClose: () => void;
  onUpdate: (accountId: string, payload: UpdateMailPayload) => Promise<void>;
  onRequestDelete: (account: MailAccountItem) => void;
}

export const MailDetailsModalContent: React.FC<MailDetailsModalContentProps> = ({
  account,
  forwardTargets,
  onClose,
  onUpdate,
  onRequestDelete,
}) => {
  const [selectedForward, setSelectedForward] = useState(
    isVaultDestination(account.forwardTo) ? NO_FORWARD : account.forwardTo
  );
  const [note, setNote] = useState(account.note);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forwardOptions = useMemo<SelectOption[]>(() => {
    const isCurrentVault = isVaultDestination(account.forwardTo);
    const options: SelectOption[] = [
      { value: NO_FORWARD, label: 'Vault' },
      ...forwardTargets.map((t) => ({ value: t.email, label: t.email })),
    ];
    // Keep the current value selectable even if it is no longer a verified target
    if (!isCurrentVault && !options.some((o) => o.value === account.forwardTo)) {
      options.push({ value: account.forwardTo, label: account.forwardTo });
    }
    return options.map((o) => {
      const isCurrent = isCurrentVault ? o.value === NO_FORWARD : o.value === account.forwardTo;
      return isCurrent ? { ...o, badge: 'Current' } : o;
    });
  }, [forwardTargets, account.forwardTo]);

  const hasChanges =
    selectedForward !== account.forwardTo || note.trim() !== account.note.trim();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isBusy) return;

    setErrorMessage(null);
    setIsBusy(true);
    try {
      await onUpdate(account.id, {
        forwardTo: selectedForward,
        note: note.trim(),
      });
      setIsSaved(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setIsSaved(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-3.5">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Full Email */}
      <div className="rounded-lg bg-elevated border border-default p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-fg-muted leading-none">Email Address</span>
          <span className="font-mono text-xs font-semibold text-fg-primary leading-none">
            {account.email}
          </span>
        </div>
      </div>

      {/* Created Date & Created Time Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-lg bg-elevated/60 border border-default p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1.5 leading-none">
            <CalendarBlank size={13} weight="duotone" className="shrink-0" />
            <span>Created Date</span>
          </div>
          <p className="font-mono text-xs font-semibold text-fg-primary leading-none">
            {account.createdDate}
          </p>
        </div>

        <div className="rounded-lg bg-elevated/60 border border-default p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1.5 leading-none">
            <Clock size={13} weight="duotone" className="shrink-0" />
            <span>Created Time</span>
          </div>
          <p className="font-mono text-xs font-semibold text-fg-primary leading-none">
            {account.createdTime}
          </p>
        </div>
      </div>

      {/* Editable Forwarding Destination */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-xs font-medium text-fg-secondary">
          <span>Forward To</span>
          <span className="text-fg-muted font-normal">Current: {account.forwardTo}</span>
        </div>

        <CustomSelect
          value={selectedForward}
          options={forwardOptions}
          onChange={(val) => {
            setSelectedForward(val);
            setIsSaved(false);
          }}
          icon={<ArrowBendUpRight size={14} weight="bold" />}
        />
      </div>

      {/* Editable Optional Note */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary">
          <label htmlFor="mail-details-note">Note</label>
          <span className="text-fg-muted font-normal text-[11px]">(Optional)</span>
        </div>

        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
            <FileText size={14} weight="bold" />
          </span>
          <input
            id="mail-details-note"
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Add an optional note for this address..."
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-8 pr-9 py-2 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsFullViewOpen(true)}
            aria-label="Open NotePad editor"
            className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded text-fg-muted hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <CornersOut size={13} weight="bold" />
          </button>
        </div>
      </div>

      {/* NotePad Modal */}
      <BaseModal
        isOpen={isFullViewOpen}
        onClose={() => setIsFullViewOpen(false)}
        title="NotePad"
        subtitle={account.email}
        icon={<FileText size={16} weight="bold" className="text-accent" />}
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-fg-muted">
              {note.length} characters{note.trim() ? ` · ${note.trim().split(/\s+/).length} words` : ''}
            </span>
            <button
              type="button"
              onClick={() => setIsFullViewOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check size={13} weight="bold" />
              <span>Done</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-fg-muted leading-relaxed">
            Write extended notes, sentences, instructions, or documentation for this address:
          </p>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setIsSaved(false);
            }}
            rows={10}
            placeholder="Type your notes or sentences here..."
            className="w-full rounded-lg bg-input hover:bg-input-hover focus:bg-surface-solid p-3.5 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none resize-y leading-relaxed font-sans min-h-[220px]"
            autoFocus
          />
        </div>
      </BaseModal>

      {/* Modal Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-subtle">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onRequestDelete(account)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-default bg-elevated px-2.5 py-1.5 text-xs font-medium text-danger hover:border-strong disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Trash size={13} weight="duotone" />
            <span className="leading-none">Delete</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary cursor-pointer transition-colors"
          >
            Close
          </button>
          {isSaved ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs select-none cursor-default transition-all duration-200"
            >
              <Check size={14} weight="bold" />
              <span>Saved</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isBusy || !hasChanges}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {isBusy && <CircleNotch size={13} weight="bold" className="animate-spin" />}
              <span>{isBusy ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
