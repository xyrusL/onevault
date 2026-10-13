import React, { useMemo, useState } from 'react';
import {
  At,
  CheckCircle,
  FolderPlus,
  Info,
  LockSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { CustomSelect, SelectOption } from '../../../shared/components/forms';
import { CreateSubdomainPayload, MailDomain } from '../types/mail.types';
import { SubdomainIcon } from './SubdomainIcon';

interface CreateSubdomainModalContentProps {
  domains: MailDomain[];
  initialRootDomain?: string;
  onCancel: () => void;
  onCreate: (payload: CreateSubdomainPayload) => Promise<void>;
}

export const CreateSubdomainModalContent: React.FC<CreateSubdomainModalContentProps> = ({
  domains,
  initialRootDomain = '',
  onCancel,
  onCreate,
}) => {
  const rootDomains = useMemo(
    () =>
      domains.filter(
        (d) =>
          !domains.some(
            (other) => other.name !== d.name && d.name.endsWith(`.${other.name}`)
          )
      ),
    [domains]
  );

  const [rootDomain, setRootDomain] = useState(() => {
    if (initialRootDomain && rootDomains.some((d) => d.name === initialRootDomain)) {
      return initialRootDomain;
    }
    return rootDomains[0]?.name ?? '';
  });

  const [isLocked, setIsLocked] = useState(() =>
    Boolean(initialRootDomain && rootDomains.some((d) => d.name === initialRootDomain))
  );

  const [subdomainPrefix, setSubdomainPrefix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rootDomainOptions = useMemo<SelectOption[]>(
    () =>
      rootDomains.map((d) => ({
        value: d.name,
        label: `@${d.name}`,
      })),
    [rootDomains]
  );

  const cleanPrefix = subdomainPrefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  const effectiveFullDomain = cleanPrefix
    ? `${cleanPrefix}.${rootDomain}`
    : rootDomain;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanPrefix || !rootDomain) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onCreate({
        rootDomain,
        subdomain: cleanPrefix,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to create subdomain.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Preview Banner */}
      <div className="rounded-lg bg-elevated border border-default p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <SubdomainIcon name={cleanPrefix || 'preview'} size={18} className="h-8 w-8" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-fg-muted font-semibold block leading-none mb-1">
              Subdomain Folder Preview
            </span>
            <span className="font-mono text-xs font-semibold text-fg-primary truncate block leading-none">
              @{effectiveFullDomain || 'your-subdomain.domain'}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-accent font-medium bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
          Email Routing
        </span>
      </div>

      {/* Root Domain Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-fg-secondary">
            Base Domain
          </label>
          {isLocked && (
            <button
              type="button"
              onClick={() => setIsLocked(false)}
              className="text-[11px] text-accent hover:underline cursor-pointer"
            >
              Change base domain
            </button>
          )}
        </div>
        {isLocked ? (
          <div className="flex items-center justify-between rounded-lg bg-elevated/70 border border-default px-3 py-2 text-sm text-fg-primary font-mono select-none">
            <div className="flex items-center gap-2 truncate">
              <At size={14} weight="bold" className="text-accent shrink-0" />
              <span className="truncate">@{rootDomain}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-fg-muted tracking-wider px-2 py-0.5 rounded bg-surface border border-subtle shrink-0">
              <LockSimple size={11} weight="bold" className="text-accent" />
              Locked to @{rootDomain}
            </span>
          </div>
        ) : (
          <CustomSelect
            value={rootDomain}
            options={rootDomainOptions}
            onChange={setRootDomain}
            icon={<At size={14} weight="bold" />}
          />
        )}
      </div>

      {/* Subdomain Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="subdomain-prefix"
          className="block text-xs font-medium text-fg-secondary"
        >
          Subdomain Prefix
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
            <FolderPlus size={14} weight="duotone" />
          </span>
          <input
            id="subdomain-prefix"
            type="text"
            required
            autoFocus
            value={subdomainPrefix}
            onChange={(e) => setSubdomainPrefix(e.target.value)}
            placeholder="e.g. spotify, billing, accounts"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-8 pr-3 py-2 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
        </div>
        <p className="text-[11px] text-fg-muted">
          Only lowercase letters, numbers, and hyphens (e.g. <span className="font-mono text-fg-secondary">spotify</span> will create <span className="font-mono text-fg-secondary">@{cleanPrefix || 'spotify'}.{rootDomain}</span>).
        </p>
      </div>

      {/* Cloudflare Routing Explanation Card */}
      <div className="rounded-lg bg-surface border border-default p-3 space-y-1.5 text-xs text-fg-secondary">
        <div className="flex items-center gap-1.5 text-fg-primary font-medium">
          <Info size={14} weight="bold" className="text-accent" />
          <span>How Email Routing on Subdomains Works</span>
        </div>
        <p className="text-[11px] text-fg-muted leading-relaxed">
          Cloudflare Email Routing rules will match any addresses sent to{' '}
          <strong className="text-fg-primary font-mono">@{effectiveFullDomain}</strong>.
          DNS MX records (<span className="font-mono">route1.mx.cloudflare.net</span>) and SPF are automatically provisioned in your Cloudflare zone so mail servers deliver incoming emails directly to OneVault.
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-success pt-0.5">
          <CheckCircle size={13} weight="fill" className="shrink-0" />
          <span>Organizes dedicated mailboxes in their own folder.</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-subtle">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !cleanPrefix || !rootDomain}
          className="inline-flex items-center justify-center rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? 'Creating Subdomain...' : 'Create Subdomain'}
        </button>
      </div>
    </form>
  );
};
