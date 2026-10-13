import React, { useMemo, useState } from 'react';
import {
  ArrowsClockwise,
  Check,
  Copy,
  EnvelopeOpen,
  EnvelopeSimple,
  FileText,
  PaperPlaneTilt,
  Pulse,
  Tag,
  Tray,
} from '@phosphor-icons/react';
import { MailActivityItem } from '../../types/mail-inbox.types';
import { AccountServiceDetectionSummary } from '../../types/mail-service-detector.types';
import { isVaultDestination, MailAccountItem } from '../../types/mail.types';
import { MailServiceTagBadge } from './MailServiceTagBadge';
import { resolveSubdomainTheme } from '../SubdomainIcon';

interface MailAccountActivityModalContentProps {
  account: MailAccountItem;
  summary?: AccountServiceDetectionSummary;
  onClose: () => void;
  onOpenNote?: (account: MailAccountItem) => void;
  onSelectActivity?: (activity: MailActivityItem) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MailAccountActivityModalContent: React.FC<
  MailAccountActivityModalContentProps
> = ({
  account,
  summary,
  onClose,
  onOpenNote,
  onSelectActivity,
  onRefresh,
  isRefreshing = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const isVault = isVaultDestination(account.forwardTo);
  const tags = summary?.tags || [];
  const activityItems = summary?.activityItems || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(account.email).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // Filter activities by selected tag if one is active
  const filteredActivities = useMemo(() => {
    if (!selectedTagId) return activityItems;
    const activeTag = tags.find((t) => t.id === selectedTagId);
    if (!activeTag) return activityItems;
    const tagName = activeTag.name.toLowerCase();
    const tagDomain = activeTag.domain.toLowerCase();

    return activityItems.filter((act) => {
      const sender = act.sender.toLowerCase();
      const senderName = (act.senderName || '').toLowerCase();
      const subject = (act.subject || '').toLowerCase();
      return (
        sender.includes(tagDomain) ||
        senderName.includes(tagName) ||
        subject.includes(tagName)
      );
    });
  }, [activityItems, selectedTagId, tags]);

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
       * 1. EMAIL METADATA HEADER CARD
       * ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-default bg-elevated/70 p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <Pulse size={16} weight="bold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm truncate">
                  <strong className="font-semibold text-fg-primary">{account.localPart}</strong>
                  <span className={`font-normal ${resolveSubdomainTheme(account.domain).domainTextClass}`}>
                    @{account.domain}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy email address"
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-surface-solid text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check size={12} weight="bold" className="text-emerald-400" />
                  ) : (
                    <Copy size={12} weight="regular" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-fg-muted leading-tight">
                {isVault ? (
                  <span className="text-cyan-400 font-medium">Routes directly to Vault Inbox</span>
                ) : (
                  <span>
                    Forwarded to <strong className="text-fg-secondary font-mono">{account.forwardTo}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {account.note && onOpenNote && (
              <button
                type="button"
                onClick={() => onOpenNote(account)}
                title="View NotePad"
                className="inline-flex items-center gap-1 rounded-md border border-default bg-surface hover:bg-elevated px-2 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
              >
                <FileText size={12} weight="bold" />
                <span>Note</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh email activity"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-default bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowsClockwise
                  size={13}
                  weight="bold"
                  className={isRefreshing ? 'animate-spin text-accent' : ''}
                />
              </button>
            )}
          </div>
        </div>

        {/* Timestamp & Account Stats Bar — Clean text without redundant icons */}
        <div className="flex items-center gap-3 pt-1 border-t border-subtle text-[11px] text-fg-muted flex-wrap">
          <span>
            Created: <span className="font-mono text-fg-secondary">{account.createdDate}</span>
          </span>
          <span className="text-fg-subtle">·</span>
          <span>
            Time: <span className="font-mono text-fg-secondary">{account.createdTime}</span>
          </span>
          <span className="text-fg-subtle">·</span>
          <span>
            Inbound Messages:{' '}
            <span className="font-mono font-semibold text-fg-primary">
              {activityItems.length}
            </span>
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * 2. GENERATED TAGS PANEL
       * ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-default bg-surface-solid p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag size={14} weight="bold" className="text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-primary">
              Generated Tags
            </h3>
          </div>
        </div>

        {tags.length === 0 ? (
          <div className="rounded-lg border border-dashed border-subtle bg-elevated/40 p-3 text-center text-xs text-fg-muted">
            <p>No service tags generated yet for this email address.</p>
            <p className="mt-1 text-[11px] text-fg-subtle">
              When sign-up or incoming emails arrive (e.g. from GitHub, Roblox, Facebook),
              the algorithm will automatically identify the platform, generate tags, and make
              it searchable!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* "All" Filter chip */}
              <button
                type="button"
                onClick={() => setSelectedTagId(null)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                  selectedTagId === null
                    ? 'bg-elevated border-strong text-fg-primary shadow-xs'
                    : 'bg-surface border-default text-fg-muted hover:text-fg-secondary'
                }`}
              >
                <span>All Services</span>
                <span className="font-mono text-[10px] opacity-75">
                  ({activityItems.length})
                </span>
              </button>

              {/* Tag Badges with interactive filtering */}
              {tags.map((tag) => (
                <MailServiceTagBadge
                  key={tag.id}
                  tag={tag}
                  size="md"
                  showCount
                  isSelected={selectedTagId === tag.id}
                  onClick={(t) =>
                    setSelectedTagId((prev) => (prev === t.id ? null : t.id))
                  }
                />
              ))}
            </div>

            <p className="text-[11px] text-fg-muted leading-relaxed">
              💡 {tags.length === 1 ? '1 service detected' : `${tags.length} services detected`} for this alias.
              You can search <strong className="text-sky-300 font-mono">"{tags[0].name.toLowerCase()}"</strong> anywhere
              in OneVault to quickly find this address.
            </p>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * 3. INCOMING EMAIL ACTIVITY STREAM
       * ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            <Tray size={14} weight="duotone" />
            <span>
              Inbound Activity Feed{' '}
              {filteredActivities.length > 0 && `(${filteredActivities.length})`}
            </span>
          </div>
          {selectedTagId && (
            <button
              type="button"
              onClick={() => setSelectedTagId(null)}
              className="text-[11px] text-sky-400 hover:underline cursor-pointer"
            >
              Clear tag filter
            </button>
          )}
        </div>

        {filteredActivities.length === 0 ? (
          <div className="rounded-xl border border-default bg-surface p-8 text-center text-xs text-fg-muted">
            <EnvelopeSimple size={24} weight="duotone" className="mx-auto mb-2 text-fg-subtle" />
            <p className="font-medium text-fg-secondary">No inbound activity recorded yet</p>
            <p className="mt-1 text-[11px] text-fg-subtle max-w-sm mx-auto">
              Any email sent to <span className="font-mono text-fg-muted">{account.email}</span>{' '}
              will be logged here and tagged automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-default bg-surface-solid divide-y divide-subtle overflow-hidden max-h-[340px] overflow-y-auto">
            {filteredActivities.map((act) => {
              const isActVault = isVaultDestination(act.forwardTo);
              const isUnread = !act.isRead;

              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity && onSelectActivity(act)}
                  role={onSelectActivity ? 'button' : undefined}
                  tabIndex={onSelectActivity ? 0 : undefined}
                  className={`p-3 transition-colors ${
                    onSelectActivity ? 'cursor-pointer hover:bg-elevated/60' : ''
                  } ${isUnread ? 'bg-emerald-500/[0.04]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Left: Message icon & details */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          !isActVault
                            ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400'
                            : isUnread
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                            : 'border-default bg-elevated text-fg-muted'
                        }`}
                      >
                        {!isActVault ? (
                          <PaperPlaneTilt size={13} weight="duotone" />
                        ) : isUnread ? (
                          <EnvelopeSimple size={13} weight="fill" />
                        ) : (
                          <EnvelopeOpen size={13} weight="duotone" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isUnread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                          )}
                          <span className="truncate text-xs font-semibold text-fg-primary">
                            {act.senderName || act.sender}
                          </span>
                          <span className="truncate text-[10px] font-mono text-fg-muted">
                            &lt;{act.sender}&gt;
                          </span>
                        </div>

                        <p className="text-xs font-medium text-fg-secondary truncate">
                          {act.subject || '(No subject)'}
                        </p>

                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-fg-muted">
                          <span>
                            {act.receivedDate} · {act.receivedTime}
                          </span>
                          <span>·</span>
                          <span className="truncate">
                            Routing:{' '}
                            {isActVault ? (
                              <strong className="text-cyan-400 font-medium">Vault Inbox</strong>
                            ) : (
                              <strong className="text-emerald-400 font-mono font-medium">
                                → {act.forwardTo}
                              </strong>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * 4. MODAL FOOTER
       * ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-md border border-default bg-elevated hover:bg-surface-solid px-3.5 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
