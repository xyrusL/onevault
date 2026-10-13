import React, { useState } from 'react';
import {
  CircleNotch,
  EnvelopeSimple,
  Globe,
  Trash,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react';
import { MailAccountItem, MailFolderInfo } from '../types/mail.types';
import { SubdomainIcon } from './SubdomainIcon';

interface DeleteSubdomainModalContentProps {
  folder: MailFolderInfo;
  affectedAccounts: MailAccountItem[];
  onCancel: () => void;
  onConfirmDelete: (fullDomain: string) => Promise<void>;
}

export const DeleteSubdomainModalContent: React.FC<DeleteSubdomainModalContentProps> = ({
  folder,
  affectedAccounts,
  onCancel,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirmDelete(folder.fullDomain);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete subdomain.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-elevated border border-default p-3 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target Subdomain Banner */}
      <div className="flex items-center gap-3 rounded-xl bg-elevated border border-default p-3.5">
        <SubdomainIcon
          name={folder.subdomainPart || folder.rootDomain}
          size={22}
          className="h-10 w-10 shadow-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-fg-primary truncate">
              @{folder.fullDomain}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20 font-medium">
              Permanent Deletion
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-muted truncate">
            Under root zone <span className="font-mono text-fg-secondary">@{folder.rootDomain}</span>
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="flex items-start gap-2.5 rounded-xl bg-danger/5 border border-danger/20 p-3 text-xs text-danger leading-relaxed">
        <Warning size={16} weight="fill" className="shrink-0 mt-0.5" />
        <span>
          Deleting this subdomain will immediately stop all incoming email routing for this address and cannot be undone.
        </span>
      </div>

      {/* Breakdown of What Will Be Affected */}
      <div className="rounded-xl bg-surface border border-default p-3.5 space-y-2.5 text-xs">
        <span className="font-semibold text-fg-primary block text-[11px] uppercase tracking-wider">
          Resources Affected by Deletion
        </span>

        <div className="space-y-2 text-fg-secondary">
          {/* Cloudflare DNS */}
          <div className="flex items-start gap-2">
            <Globe size={15} weight="duotone" className="shrink-0 text-accent mt-0.5" />
            <div>
              <strong className="text-fg-primary font-medium">Cloudflare DNS Records:</strong>
              <p className="text-[11px] text-fg-muted mt-0.5">
                All MX records (<span className="font-mono text-fg-secondary">route1.mx.cloudflare.net</span>) and SPF TXT records created for <span className="font-mono text-fg-secondary">@{folder.fullDomain}</span> will be deleted from Cloudflare DNS.
              </p>
            </div>
          </div>

          {/* Email Addresses */}
          <div className="flex items-start gap-2">
            <EnvelopeSimple size={15} weight="duotone" className="shrink-0 text-accent mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-fg-primary font-medium">
                  Associated Email Addresses ({affectedAccounts.length}):
                </strong>
                {affectedAccounts.length > 0 && (
                  <span className="text-[10px] text-danger font-medium">Will be deleted</span>
                )}
              </div>

              {affectedAccounts.length === 0 ? (
                <p className="text-[11px] text-fg-muted mt-0.5">
                  No active email addresses under this subdomain.
                </p>
              ) : (
                <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1 rounded-lg bg-elevated/60 border border-subtle p-2">
                  {affectedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between gap-2 text-[11px] font-mono text-fg-secondary"
                    >
                      <span className="truncate">{acc.email}</span>
                      <span className="text-[10px] text-fg-muted shrink-0">
                        ↳ {acc.forwardTo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-subtle">
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
          onClick={() => void handleConfirm()}
          disabled={isDeleting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-danger hover:bg-danger-hover text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer transition-colors"
        >
          {isDeleting ? (
            <>
              <CircleNotch size={14} weight="bold" className="animate-spin" />
              <span>Deleting Subdomain & Cloudflare Records...</span>
            </>
          ) : (
            <>
              <Trash size={14} weight="bold" />
              <span>Delete Subdomain & Records</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
