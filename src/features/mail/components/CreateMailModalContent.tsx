import React, { useMemo, useState } from 'react';
import {
  ArrowBendUpRight,
  At,
  Check,
  CornersOut,
  FileText,
  LockSimple,
  User,
  WarningCircle,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals';
import { CustomSelect, SelectOption } from '../../../shared/components/forms';
import {
  CreateMailPayload,
  ForwardTarget,
  MailDomain,
  NO_FORWARD,
} from '../types/mail.types';
import { SubdomainIcon } from './SubdomainIcon';

interface CreateMailModalContentProps {
  domains: MailDomain[];
  forwardTargets: ForwardTarget[];
  initialDomain?: string;
  onCancel: () => void;
  /** Should throw on failure so the error can be shown inside the modal. */
  onCreate: (payload: CreateMailPayload) => Promise<void>;
}

export const CreateMailModalContent: React.FC<CreateMailModalContentProps> = ({
  domains,
  forwardTargets,
  initialDomain,
  onCancel,
  onCreate,
}) => {
  // Ensure initialDomain is part of the domains list so it is never missing
  const effectiveDomains = useMemo(() => {
    const list = [...domains];
    if (
      initialDomain &&
      !list.some((d) => d.name.toLowerCase() === initialDomain.toLowerCase())
    ) {
      list.push({
        id: initialDomain.toLowerCase(),
        name: initialDomain.toLowerCase(),
        status: 'active',
      });
    }
    return list;
  }, [domains, initialDomain]);

  const rootDomains = useMemo(
    () =>
      effectiveDomains.filter(
        (d) =>
          !effectiveDomains.some(
            (other) =>
              other.name.toLowerCase() !== d.name.toLowerCase() &&
              d.name.toLowerCase().endsWith(`.${other.name.toLowerCase()}`)
          )
      ),
    [effectiveDomains]
  );

  const initialInfo = useMemo(() => {
    if (!initialDomain) {
      return {
        rootDomain: rootDomains[0]?.name ?? '',
        subdomain: NO_FORWARD,
        isSubdomain: false,
        subdomainPrefix: '',
      };
    }
    const normalized = initialDomain.trim().toLowerCase();
    const exactRoot = rootDomains.find(
      (rd) => rd.name.toLowerCase() === normalized
    );
    if (exactRoot) {
      return {
        rootDomain: exactRoot.name,
        subdomain: NO_FORWARD,
        isSubdomain: false,
        subdomainPrefix: '',
      };
    }
    const parentRoot = rootDomains.find(
      (rd) =>
        normalized !== rd.name.toLowerCase() &&
        normalized.endsWith(`.${rd.name.toLowerCase()}`)
    );
    if (parentRoot) {
      const prefix = normalized.slice(0, -(parentRoot.name.length + 1));
      return {
        rootDomain: parentRoot.name,
        subdomain: normalized,
        isSubdomain: true,
        subdomainPrefix: prefix,
      };
    }
    return {
      rootDomain: rootDomains[0]?.name ?? '',
      subdomain: NO_FORWARD,
      isSubdomain: false,
      subdomainPrefix: '',
    };
  }, [initialDomain, rootDomains]);

  const [localPart, setLocalPart] = useState('');
  const [rootDomain, setRootDomain] = useState(() => initialInfo.rootDomain);
  const [isLockedDomain, setIsLockedDomain] = useState(() => Boolean(initialDomain));
  const [subdomain, setSubdomain] = useState(() => initialInfo.subdomain);

  const [forwardTo, setForwardTo] = useState(NO_FORWARD);
  const [note, setNote] = useState('');
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRootDomain = rootDomain || rootDomains[0]?.name || '';

  const subdomainsForRoot = useMemo(() => {
    const subs = effectiveDomains.filter(
      (d) =>
        activeRootDomain &&
        d.name.toLowerCase() !== activeRootDomain.toLowerCase() &&
        d.name.toLowerCase().endsWith(`.${activeRootDomain.toLowerCase()}`)
    );
    if (
      initialInfo.isSubdomain &&
      initialInfo.rootDomain.toLowerCase() === activeRootDomain.toLowerCase() &&
      !subs.some((s) => s.name.toLowerCase() === initialInfo.subdomain.toLowerCase())
    ) {
      subs.push({
        id: initialInfo.subdomain,
        name: initialInfo.subdomain,
        status: 'active',
      });
    }
    return subs;
  }, [effectiveDomains, activeRootDomain, initialInfo]);

  const rootDomainOptions = useMemo<SelectOption[]>(
    () =>
      rootDomains.map((d) => {
        const subCount = effectiveDomains.filter(
          (item) =>
            item.name.toLowerCase() !== d.name.toLowerCase() &&
            item.name.toLowerCase().endsWith(`.${d.name.toLowerCase()}`)
        ).length;
        return {
          value: d.name,
          label: `@${d.name}`,
          badge: subCount > 0 ? `${subCount} sub` : undefined,
        };
      }),
    [rootDomains, effectiveDomains]
  );

  const subdomainOptions = useMemo<SelectOption[]>(
    () => [
      { value: NO_FORWARD, label: 'None (Root)', badge: 'Default' },
      ...subdomainsForRoot.map((sub) => {
        const prefix = sub.name.slice(0, -(activeRootDomain.length + 1));
        return {
          value: sub.name,
          label: `${prefix}.${activeRootDomain}`,
          badge: prefix,
        };
      }),
    ],
    [subdomainsForRoot, activeRootDomain]
  );

  const forwardOptions = useMemo<SelectOption[]>(
    () => [
      { value: NO_FORWARD, label: 'Vault', badge: 'Default' },
      ...forwardTargets.map((t) => ({ value: t.email, label: t.email })),
    ],
    [forwardTargets]
  );

  const effectiveDomain = useMemo(() => {
    if (subdomain !== NO_FORWARD) {
      const match = subdomainsForRoot.find(
        (s) => s.name.toLowerCase() === subdomain.toLowerCase()
      );
      if (match) return match.name;
      if (subdomain.toLowerCase().endsWith(`.${activeRootDomain.toLowerCase()}`)) {
        return subdomain;
      }
    }
    return activeRootDomain;
  }, [subdomain, subdomainsForRoot, activeRootDomain]);

  const sanitizedName = localPart.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');

  const handleRootDomainChange = (nextRoot: string) => {
    setRootDomain(nextRoot);
    setSubdomain(NO_FORWARD);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizedName || !effectiveDomain) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onCreate({
        localPart: sanitizedName,
        domain: effectiveDomain,
        forwardTo,
        note: note.trim(),
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to create email.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Address Preview Banner */}
      <div className="rounded-lg bg-elevated border border-default px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-xs text-fg-muted leading-none">Preview</span>
        <span className="font-mono text-xs font-semibold text-fg-primary truncate leading-none">
          {sanitizedName || 'name'}@{effectiveDomain || 'domain'}
        </span>
      </div>

      {/* Name / Handle Input */}
      <div className="space-y-1.5">
        <label htmlFor="mail-handle" className="block text-xs font-medium text-fg-secondary">
          Email Name
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
            <User size={14} weight="duotone" />
          </span>
          <input
            id="mail-handle"
            type="text"
            required
            autoFocus
            value={localPart}
            onChange={(e) => setLocalPart(e.target.value)}
            placeholder="e.g. alex.vance"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-8 pr-3 py-2 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
        </div>
      </div>

      {/* Categorized Domain & Subdomain Selection */}
      {rootDomains.length === 0 ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-fg-secondary">Select Domain</label>
          <p className="rounded-md border border-default bg-elevated px-3 py-2 text-xs text-fg-muted">
            No active domains found in this Cloudflare account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-fg-secondary">
                Select Domain
              </label>
              {isLockedDomain && (
                <button
                  type="button"
                  onClick={() => setIsLockedDomain(false)}
                  className="text-[11px] text-accent hover:underline cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
            {isLockedDomain ? (
              <div className="flex items-center justify-between rounded-lg bg-elevated/70 border border-default px-3 py-2 text-sm text-fg-primary font-mono select-none">
                <div className="flex items-center gap-2 truncate">
                  <At size={14} weight="bold" className="text-accent shrink-0" />
                  <span className="truncate">@{activeRootDomain}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-fg-muted tracking-wider px-2 py-0.5 rounded bg-surface border border-subtle shrink-0">
                  <LockSimple size={10} weight="bold" className="text-accent" />
                  Locked
                </span>
              </div>
            ) : (
              <CustomSelect
                value={activeRootDomain}
                options={rootDomainOptions}
                onChange={handleRootDomainChange}
                icon={<At size={14} weight="bold" />}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-fg-secondary">
              <span>Subdomain</span>
              <span className="text-fg-muted font-normal">
                {isLockedDomain && initialInfo.isSubdomain
                  ? 'Locked to folder'
                  : subdomainsForRoot.length > 0
                    ? `${subdomainsForRoot.length} available`
                    : 'Root only'}
              </span>
            </div>
            {isLockedDomain && initialInfo.isSubdomain ? (
              <div className="flex items-center justify-between rounded-lg bg-elevated/70 border border-default px-3 py-2 text-sm text-fg-primary font-mono select-none">
                <div className="flex items-center gap-2 truncate">
                  <SubdomainIcon name={initialInfo.subdomainPrefix} size={14} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{initialInfo.subdomainPrefix}.{activeRootDomain}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-fg-muted tracking-wider px-2 py-0.5 rounded bg-surface border border-subtle shrink-0">
                  <LockSimple size={10} weight="bold" className="text-accent" />
                  Locked
                </span>
              </div>
            ) : (
              <CustomSelect
                value={subdomain}
                options={subdomainOptions}
                onChange={setSubdomain}
                icon={<At size={14} weight="duotone" />}
              />
            )}
          </div>
        </div>
      )}

      {/* Forward To (None default + verified Email Routing destinations) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-fg-secondary">Forward To</label>
        <CustomSelect
          value={forwardTo}
          options={forwardOptions}
          onChange={setForwardTo}
          icon={<ArrowBendUpRight size={14} weight="bold" />}
        />
      </div>

      {/* Optional Note Field with Full View NotePad Expander */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-fg-secondary">
          <label htmlFor="mail-note">Note</label>
          <span className="text-fg-muted font-normal">Optional</span>
        </div>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
            <FileText size={14} weight="bold" />
          </span>
          <input
            id="mail-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Used for GitHub | Billing account"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-8 pr-9 py-2 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsFullViewOpen(true)}
            title="Open full view NotePad"
            aria-label="Open full view NotePad"
            className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded text-fg-muted hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <CornersOut size={13} weight="bold" />
          </button>
        </div>
      </div>

      {/* Full View NotePad Modal */}
      <BaseModal
        isOpen={isFullViewOpen}
        onClose={() => setIsFullViewOpen(false)}
        title="NotePad"
        subtitle={
          sanitizedName && effectiveDomain
            ? `${sanitizedName}@${effectiveDomain}`
            : 'Draft Email Note'
        }
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
            onChange={(e) => setNote(e.target.value)}
            rows={10}
            placeholder="Type your notes or sentences here..."
            className="w-full rounded-lg bg-input hover:bg-input-hover focus:bg-surface-solid p-3.5 text-sm text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none resize-y leading-relaxed font-sans min-h-[220px]"
            autoFocus
          />
        </div>
      </BaseModal>

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
          disabled={isSubmitting || !sanitizedName || !effectiveDomain}
          className="inline-flex items-center justify-center rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? 'Creating...' : 'Create Email'}
        </button>
      </div>
    </form>
  );
};
