import React, { useState } from 'react';
import {
  ArrowBendUpRight,
  CaretRight,
  Check,
  Copy,
  FileText,
  PaperPlaneTilt,
  Pulse,
  Tray,
} from '@phosphor-icons/react';
import { AccountServiceDetectionSummary } from '../types/mail-service-detector.types';
import {
  isVaultDestination,
  MailAccountItem,
} from '../types/mail.types';
import { MailServiceTagBadge } from './service-activity';
import { resolveSubdomainTheme, SubdomainIcon } from './SubdomainIcon';

interface MailAccountRowProps {
  item: MailAccountItem;
  summary?: AccountServiceDetectionSummary;
  onSelect: (item: MailAccountItem) => void;
  onOpenInbox: (item: MailAccountItem) => void;
  onOpenActivity?: (item: MailAccountItem) => void;
  onOpenNote?: (item: MailAccountItem) => void;
}

export const MailAccountRow: React.FC<MailAccountRowProps> = ({
  item,
  summary,
  onSelect,
  onOpenInbox,
  onOpenActivity,
  onOpenNote,
}) => {
  const [copied, setCopied] = useState(false);
  const isVault = isVaultDestination(item.forwardTo);
  const isRootDomain = item.domain.split('.').length <= 2;
  const theme = resolveSubdomainTheme(item.domain, isRootDomain);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.email).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className="group relative hover:bg-elevated/75 transition-all duration-200 cursor-pointer"
    >
      {/* ─────────────────────────────────────────────────────────────
       * MOBILE DEDICATED APP ROW (< sm screens)
       * Touch-friendly card format with quick actions
       * ───────────────────────────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col gap-1.5 p-2.5">
        {/* Row 1: Email Address + Tags + Copy Button */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <SubdomainIcon
                name={item.domain}
                isRoot={isRootDomain}
                size={13}
                className="h-6 w-6 shrink-0"
              />
              <span className="font-mono text-xs truncate">
                <strong className="font-semibold text-fg-primary">
                  {item.localPart}
                </strong>
                <span className={`font-medium ${theme.domainTextClass}`}>
                  @{item.domain}
                </span>
              </span>
            </div>

            {/* Service Tags on Mobile */}
            {summary && summary.tags.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <MailServiceTagBadge
                  tag={summary.tags[0]}
                  size="sm"
                  onClick={() => (onOpenActivity ? onOpenActivity(item) : onSelect(item))}
                />
                {summary.tags.length > 1 && (
                  <span className="rounded px-1 py-0 text-[9px] font-mono font-semibold bg-elevated border border-default text-fg-secondary">
                    +{summary.tags.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy email address"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-elevated border border-subtle text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
          >
            {copied ? (
              <Check size={11} weight="bold" className="text-emerald-400" />
            ) : (
              <Copy size={11} weight="regular" />
            )}
          </button>
        </div>

        {/* Row 2: Forward Destination + Actions on the right */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            {isVault ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-default bg-surface-solid px-2 py-0.5 text-[10px] font-medium text-fg-secondary">
                <Tray size={11} weight="duotone" className="text-accent" />
                <span className="text-fg-primary">Vault</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-default bg-surface-solid px-2 py-0.5 text-[11px] font-mono text-fg-secondary truncate">
                <ArrowBendUpRight size={10} weight="bold" className="shrink-0 text-fg-muted" />
                <span className="truncate text-fg-primary">{item.forwardTo}</span>
                <PaperPlaneTilt size={9} weight="duotone" className="shrink-0 text-emerald-400/70" />
              </span>
            )}
            {item.note && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNote ? onOpenNote(item) : onSelect(item);
                }}
                aria-label="NotePad"
                className="inline-flex items-center justify-center h-4.5 w-4.5 rounded border border-default bg-elevated text-fg-secondary hover:text-fg-primary text-[10px] leading-none shrink-0 cursor-pointer"
              >
                <FileText size={10} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Activity Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenActivity ? onOpenActivity(item) : onSelect(item);
              }}
              title="View Activity & Generated Tags"
              className="inline-flex items-center gap-1 rounded border border-default bg-elevated hover:bg-surface-solid hover:border-strong px-2 py-0.5 text-[11px] font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
            >
              <Pulse size={11} weight="bold" className="text-fg-muted" />
              <span>Activity</span>
            </button>

            {isVault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInbox(item);
                }}
                title="Open Vault Inbox"
                className="inline-flex items-center gap-1 rounded border border-cyan-500/35 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/25 transition-colors cursor-pointer"
              >
                <Tray size={11} weight="duotone" />
                <span>Inbox</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
              className="inline-flex items-center gap-0.5 rounded border border-default bg-elevated px-2 py-0.5 text-[11px] font-medium text-fg-secondary hover:text-fg-primary hover:border-strong hover:bg-surface-solid transition-colors cursor-pointer"
            >
              <span>Details</span>
              <CaretRight size={10} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * DESKTOP TABLE ROW (sm: and above) — Vibrant Multi-Color Accents
       * ───────────────────────────────────────────────────────────── */}
      <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 px-4 py-2.5">
        {/* Column 1: Subdomain Icon + Clean Normal Email Address + Generated Tags */}
        <div className="sm:col-span-6 flex items-center gap-2.5 min-w-0">
          <SubdomainIcon
            name={item.domain}
            isRoot={isRootDomain}
            size={15}
            className="h-8 w-8 shrink-0"
          />

          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="font-mono text-sm truncate leading-none">
              <strong className="font-semibold text-fg-primary">
                {item.localPart}
              </strong>
              <span className={`font-medium ${theme.domainTextClass}`}>
                @{item.domain}
              </span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              title="Copy email address"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface-solid hover:text-fg-primary transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={12} weight="bold" className="text-emerald-400" />
              ) : (
                <Copy size={12} weight="regular" />
              )}
            </button>

            {item.note && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNote ? onOpenNote(item) : onSelect(item);
                }}
                aria-label="NotePad"
                className="inline-flex items-center justify-center h-5 w-5 rounded-md border border-default bg-elevated text-fg-secondary hover:text-fg-primary hover:border-strong transition-colors cursor-pointer shrink-0"
              >
                <FileText size={12} weight="bold" />
              </button>
            )}

            {/* Generated Service Tag Badges */}
            {summary && summary.tags.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <MailServiceTagBadge
                  tag={summary.tags[0]}
                  size="sm"
                  onClick={() => (onOpenActivity ? onOpenActivity(item) : onSelect(item))}
                />
                {summary.tags.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenActivity ? onOpenActivity(item) : onSelect(item);
                    }}
                    title={`+${summary.tags.length - 1} more detected services: ${summary.tags
                      .slice(1)
                      .map((t) => t.name)
                      .join(', ')}`}
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-elevated border border-default text-fg-secondary hover:text-fg-primary cursor-pointer transition-colors"
                  >
                    +{summary.tags.length - 1}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Forwarding Destination Pill (Clean & Non-Shining) */}
        <div className="sm:col-span-3 flex items-center gap-1.5 text-xs leading-none min-w-0">
          {isVault ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-default bg-surface-solid px-2.5 py-1 text-xs font-medium text-fg-secondary">
              <Tray size={12} weight="duotone" className="text-accent shrink-0" />
              <span className="text-fg-primary">Vault</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-default bg-surface-solid px-2.5 py-1 text-xs font-mono text-fg-secondary min-w-0 max-w-full">
              <ArrowBendUpRight
                size={12}
                weight="bold"
                className="shrink-0 text-fg-muted"
              />
              <span className="truncate text-fg-primary">{item.forwardTo}</span>
              <PaperPlaneTilt
                size={11}
                weight="duotone"
                className="shrink-0 text-emerald-400/70 ml-0.5"
              />
            </span>
          )}
        </div>

        {/* Column 3: Activity + Inbox (only for Vault) + Details Actions */}
        <div className="sm:col-span-3 flex items-center justify-end gap-1.5">
          {/* Activity Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenActivity ? onOpenActivity(item) : onSelect(item);
            }}
            title="View Inbound Activity & Generated Service Tags"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-default bg-elevated hover:bg-surface-solid hover:border-strong px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-all duration-200 cursor-pointer"
          >
            <Pulse size={12} weight="bold" className="text-fg-muted" />
            <span className="leading-none">Activity</span>
            {summary && summary.tags.length > 0 && (
              <span className="rounded-full bg-surface-solid border border-default px-1.5 py-0 text-[10px] font-mono leading-tight text-fg-secondary">
                {summary.tags.length}
              </span>
            )}
          </button>

          {isVault && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInbox(item);
              }}
              title="Open Vault Inbox"
              className="inline-flex items-center justify-center gap-1 rounded-md border border-default bg-elevated hover:bg-surface-solid hover:border-strong px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-all duration-200 cursor-pointer"
            >
              <Tray size={12} weight="duotone" className="text-accent" />
              <span className="leading-none text-fg-primary">Inbox</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-default bg-elevated px-2.5 py-1 text-xs font-medium text-fg-secondary group-hover:border-strong group-hover:bg-surface-solid group-hover:text-fg-primary transition-all duration-200 cursor-pointer"
          >
            <span className="leading-none">Details</span>
            <CaretRight
              size={11}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
