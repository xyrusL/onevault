import React, { useState } from 'react';
import {
  CaretDown,
  CaretUp,
  Clock,
  EnvelopeSimple,
  Info,
  Key,
  NotePencil,
  Tray,
  WarningCircle,
  XCircle,
  CornersOut,
  Copy,
  Check,
  MagnifyingGlass,
  X,
  ShieldWarning,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { PaginationBar } from '../../../shared/components/pagination/PaginationBar';
import { resolveApiStatusDescriptor } from '../../../shared/constants/api-status-catalog';
import type { DashboardStats } from '../types/dashboard.types';
import type { PortalSectionId } from '../../../shared/layouts/portal-layout';

interface RecentActivityFeedProps {
  stats: DashboardStats;
  onNavigate?: (section: PortalSectionId) => void;
}

type FilterTab = 'all' | 'threats' | 'mail' | 'notes' | 'twoFactor' | 'alerts';

interface FeedItem {
  id: string;
  type:
    | 'threat_act'
    | 'mail_msg'
    | 'mail_acc'
    | 'note'
    | 'token'
    | 'audit_warn'
    | 'audit_err'
    | 'audit_info';
  level?: 'info' | 'warning' | 'error';
  title: string;
  subtitle: string;
  details?: string | null;
  statusCode?: number;
  statusText?: string;
  rootCause?: string;
  resolution?: string;
  timestamp: string;
  badge: string;
  badgeColor: string;
  targetSection?: 'mail' | 'notes' | 'two-factor';
}

const PAGE_SIZE = 5;

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  stats,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const items: FeedItem[] = [];

  // 1. Inbound emails
  stats.mail.recentMessages.forEach((msg) => {
    items.push({
      id: `msg-${msg.id}`,
      type: 'mail_msg',
      title: msg.subject || '(No subject)',
      subtitle: `From: ${msg.senderName || msg.sender} → ${msg.recipientEmail}`,
      statusText: 'Inbound MIME Stored',
      timestamp: msg.receivedAt,
      badge: 'Inbound Email',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      targetSection: 'mail',
    });
  });

  // 2. Notes
  stats.notes.recentNotes.forEach((n) => {
    items.push({
      id: `note-${n.id}`,
      type: 'note',
      title: n.title,
      subtitle: n.folderName ? `Folder: ${n.folderName}` : 'No folder assigned',
      statusText: 'Encrypted Sync Ready',
      timestamp: n.updatedAt,
      badge: 'Note Updated',
      badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      targetSection: 'notes',
    });
  });

  // 3. Mail accounts
  stats.mail.recentAccounts.forEach((acc) => {
    items.push({
      id: `acc-${acc.id}`,
      type: 'mail_acc',
      title: acc.email,
      subtitle: acc.forwardTo
        ? `Forwarding to: ${acc.forwardTo}`
        : 'Direct Vault Inbox (None)',
      statusText: acc.forwardTo ? 'Forwarding Rule Active' : 'Direct Vault Inbox',
      timestamp: acc.createdAt,
      badge: 'Mailbox Created',
      badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      targetSection: 'mail',
    });
  });

  // 4. 2FA Tokens
  stats.twoFactor.recentTokens.forEach((t) => {
    items.push({
      id: `totp-${t.id}`,
      type: 'token',
      title: `${t.issuer}: ${t.label}`,
      subtitle: 'TOTP authenticator active',
      statusText: 'RFC 6238 TOTP Verified',
      timestamp: t.createdAt,
      badge: '2FA Enrolled',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      targetSection: 'two-factor',
    });
  });

  // 5. Threat Defense Interceptions from Immune System Telemetry
  if (stats.immuneSystem?.recentActors) {
    stats.immuneSystem.recentActors.forEach((actor) => {
      if (actor.action !== 'ALLOW' || actor.riskScore > 0) {
        const isBlock = actor.action === 'PENETRATION_BLOCK';
        const isQuarantine = actor.action === 'TEMP_QUARANTINE';
        items.push({
          id: `threat-${actor.id}`,
          type: 'threat_act',
          level: isBlock ? 'error' : 'warning',
          title: `Threat Intercepted: ${actor.actorIp} (${actor.countryCode})`,
          subtitle: actor.detectionVector,
          details: `Actor IP: ${actor.actorIp}\nCountry: ${actor.countryName} (${actor.countryCode})\nASN: ${actor.asnOrg}\nRisk Score: ${actor.riskScore}/100\nAction: ${actor.action}\nClient UA: ${actor.userAgentSummary}\nTarget Paths: ${actor.targetPaths.join(', ')}\nTotal Probes: ${actor.requestCount}\nDistinct 404s: ${actor.distinct404Count}`,
          statusCode: isBlock || isQuarantine ? 403 : 429,
          statusText: isBlock
            ? 'PENETRATION BLOCK'
            : isQuarantine
            ? 'TEMPORARY QUARANTINE'
            : 'RATE LIMITED',
          rootCause: `Malicious pattern detected by Self-Defense: ${actor.detectionVector}`,
          resolution: isBlock
            ? 'Surgically blocked at edge isolate. Client connection dropped immediately.'
            : isQuarantine
            ? 'Quarantined for 10 minutes in Worker RAM.'
            : 'Sliding window rate limit applied; requests slowed down.',
          timestamp: actor.lastSeenAt,
          badge: isBlock ? 'BLOCKED · 403' : isQuarantine ? 'QUARANTINE · 403' : 'RATE LIMIT · 429',
          badgeColor: isBlock
            ? 'text-rose-400 bg-rose-500/15 border-rose-500/30 font-bold'
            : isQuarantine
            ? 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold'
            : 'text-sky-400 bg-sky-500/15 border-sky-500/30 font-semibold',
        });
      }
    });
  }

  // 6. System Audit Logs, Warnings, and Non-Fatal Errors (translated via Shared API Status Catalog)
  if (stats.auditLogs?.recentLogs) {
    stats.auditLogs.recentLogs.forEach((log) => {
      const isErr = log.level === 'error';
      const isWarn = log.level === 'warning';
      const isThreatTitle =
        log.title.includes('Threat Intercepted') ||
        log.title.includes('Rate-Limit Intercepted') ||
        log.title.includes('Automated Scanner') ||
        log.title.includes('Exploit Payload');

      const desc = resolveApiStatusDescriptor({
        category: log.category,
        level: log.level,
        title: log.title,
        message: log.message,
        details: log.details,
      });

      const resolvedStatusText = log.statusText || desc.statusText;
      const resolvedStatusCode = log.statusCode || desc.statusCode;

      items.push({
        id: `audit-${log.id}`,
        type: isThreatTitle ? 'threat_act' : isErr ? 'audit_err' : isWarn ? 'audit_warn' : 'audit_info',
        level: log.level,
        title: log.title,
        subtitle: desc.meaning || log.message,
        details: log.details,
        statusCode: resolvedStatusCode,
        statusText: resolvedStatusText,
        rootCause: log.rootCause || desc.rootCause,
        resolution: log.resolution || desc.resolution,
        timestamp: log.createdAt,
        badge: isThreatTitle
          ? (resolvedStatusCode === 403 ? 'BLOCKED · 403' : 'RATE LIMIT · 429')
          : `${resolvedStatusText} · ${resolvedStatusCode}`,
        badgeColor: isThreatTitle
          ? (resolvedStatusCode === 403
              ? 'text-rose-400 bg-rose-500/15 border-rose-500/30 font-bold'
              : 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold')
          : isErr
          ? 'text-danger bg-danger/10 border-danger/20 font-bold'
          : isWarn
          ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 font-semibold'
          : 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      });
    });
  }

  // Deduplicate items with identical titles and timestamps
  const uniqueItemsMap = new Map<string, FeedItem>();
  for (const it of items) {
    const key = `${it.title}-${it.timestamp.slice(0, 19)}`;
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, it);
    }
  }
  const uniqueItems = Array.from(uniqueItemsMap.values());

  // Sort chronologically (newest first)
  uniqueItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredItems = uniqueItems.filter((item) => {
    if (activeTab === 'threats') {
      return (
        item.type === 'threat_act' ||
        item.title.includes('Threat Intercepted') ||
        item.title.includes('Rate-Limit Intercepted') ||
        item.title.includes('Automated Scanner') ||
        item.title.includes('Exploit Payload')
      );
    }
    if (activeTab === 'mail') return item.type === 'mail_msg' || item.type === 'mail_acc';
    if (activeTab === 'notes') return item.type === 'note';
    if (activeTab === 'twoFactor') return item.type === 'token';
    if (activeTab === 'alerts')
      return item.type === 'audit_err' || item.type === 'audit_warn' || item.type === 'audit_info';
    return true;
  });

  // Calculate pagination
  const totalFiltered = filteredItems.length;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedItemId(null);
  };



  const getIcon = (item: FeedItem) => {
    switch (item.type) {
      case 'threat_act':
        return <ShieldWarning size={15} weight="duotone" className="text-rose-400" />;
      case 'audit_err':
        return <XCircle size={15} weight="fill" className="text-danger" />;
      case 'audit_warn':
        return <WarningCircle size={15} weight="fill" className="text-amber-500" />;
      case 'audit_info':
        return <Info size={15} weight="fill" className="text-sky-500" />;
      case 'mail_msg':
        return <Tray size={14} weight="duotone" className="text-emerald-500" />;
      case 'mail_acc':
        return <EnvelopeSimple size={14} weight="duotone" className="text-blue-500" />;
      case 'note':
        return <NotePencil size={14} weight="duotone" className="text-purple-500" />;
      case 'token':
        return <Key size={14} weight="duotone" className="text-amber-500" />;
    }
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} · ${timePart}`;
  };

  const [activeLogModalItem, setActiveLogModalItem] = useState<FeedItem | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Split lines and check if truncation is needed for inline preview
  const PREVIEW_LINE_LIMIT = 8;

  const handleCopyLog = (text: string) => {
    void navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Helper to render log with search term highlights
  const renderHighlightedContent = (rawText: string, query: string) => {
    if (!query.trim()) {
      return rawText;
    }
    const parts = rawText.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-black px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="rounded-xl border border-default bg-surface overflow-hidden">
      {/* Full View Log Modal using Shared BaseModal */}
      {activeLogModalItem && (
        <BaseModal
          isOpen={Boolean(activeLogModalItem)}
          onClose={() => {
            setActiveLogModalItem(null);
            setLogSearchQuery('');
          }}
          title={activeLogModalItem.title}
          subtitle={`Audit Log Record · ${formatDateTime(activeLogModalItem.timestamp)} · Level: ${activeLogModalItem.level?.toUpperCase()}`}
          maxWidthClass="max-w-3xl"
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <CornersOut size={18} weight="bold" />
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full text-xs font-mono">
              <span className="text-fg-muted">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-subtle text-fg-primary text-[10px]">Ctrl+A</kbd> to select all or highlight any portion to copy.
              </span>
              <button
                type="button"
                onClick={() => handleCopyLog(activeLogModalItem.details || '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-fg font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                {hasCopied ? (
                  <>
                    <Check size={14} weight="bold" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Copy Entire Log</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {/* Plain-English Diagnostic Status Summary inside Full Log Modal */}
            {(activeLogModalItem.statusText ||
              activeLogModalItem.rootCause ||
              activeLogModalItem.resolution) && (
              <div className="rounded-xl border border-subtle bg-elevated/50 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap font-mono">
                  <span className="font-bold text-amber-400">
                    STATUS: {activeLogModalItem.statusText || activeLogModalItem.badge}
                  </span>
                  {activeLogModalItem.statusCode && (
                    <span className="px-2 py-0.5 rounded bg-surface border border-subtle text-[10.5px] text-fg-secondary">
                      HTTP {activeLogModalItem.statusCode}
                    </span>
                  )}
                </div>
                <p className="text-fg-primary leading-relaxed">
                  {activeLogModalItem.subtitle}
                </p>
                {activeLogModalItem.rootCause && (
                  <div className="pt-1.5 border-t border-subtle/60 text-[11px]">
                    <span className="font-mono font-semibold text-amber-400">Root Cause: </span>
                    <span className="text-fg-secondary">{activeLogModalItem.rootCause}</span>
                  </div>
                )}
                {activeLogModalItem.resolution && (
                  <div className="text-[11px]">
                    <span className="font-mono font-semibold text-emerald-400">Resolution: </span>
                    <span className="text-fg-secondary">{activeLogModalItem.resolution}</span>
                  </div>
                )}
              </div>
            )}

            {/* Search and Metadata Toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
                />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search specific word or error in log..."
                  className="w-full rounded-lg border border-default bg-elevated pl-8 pr-7 py-1.5 text-xs font-mono text-fg-primary placeholder:text-fg-muted focus:outline-hidden focus:border-accent"
                />
                {logSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-fg-muted shrink-0">
                <span className="px-2 py-1 rounded bg-elevated border border-subtle">
                  {(activeLogModalItem.details || '').split('\n').length} lines
                </span>
                <span className="px-2 py-1 rounded bg-elevated border border-subtle">
                  {new Blob([activeLogModalItem.details || '']).size} bytes
                </span>
              </div>
            </div>

            {/* Scrollable & Selectable Full Log Container */}
            <div className="max-h-[55vh] min-h-[220px] overflow-auto rounded-xl bg-[#09090c] border border-white/10 p-3.5 font-mono text-xs shadow-inner">
              <pre className="whitespace-pre-wrap break-all leading-relaxed text-zinc-200 select-text selection:bg-amber-400 selection:text-black">
                {renderHighlightedContent(
                  activeLogModalItem.details || '(Empty log)',
                  logSearchQuery
                )}
              </pre>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Feed Header */}
      <div className="p-4 border-b border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock size={18} weight="duotone" className="text-accent" />
            <h2 className="text-xs sm:text-sm font-bold text-fg-primary">
              Recent Vault Activity &amp; Security Audit Stream
            </h2>
          </div>

          {/* Filter Pills: scrollable on one line on mobile */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto flex-nowrap sm:flex-wrap pb-1 sm:pb-0 shrink-0">
            {([
              { id: 'all' as FilterTab, label: 'All Activity' },
              { id: 'threats' as FilterTab, label: 'Threats' },
              { id: 'mail' as FilterTab, label: 'Mail' },
              { id: 'notes' as FilterTab, label: 'Notes' },
              { id: 'twoFactor' as FilterTab, label: '2FA' },
              { id: 'alerts' as FilterTab, label: 'Warnings & Alerts' },
            ] as Array<{ id: FilterTab; label: string }>).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-fg font-semibold shadow-2xs'
                    : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity List Container */}
      <div className="divide-y divide-subtle px-4">
        {paginatedItems.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-xs text-fg-muted italic">
              No activity or alert records match this filter.
            </p>
            {activeTab === 'alerts' && (
              <p className="text-[11px] text-emerald-500 font-medium">
                Vault health is 100% clean with zero fatal errors.
              </p>
            )}
          </div>
        ) : (
          paginatedItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const hasDetails = Boolean(item.details || item.rootCause || item.resolution);
            const isClickable = item.targetSection || hasDetails;

            const lines = (item.details || '').split('\n');
            const isLongLog = lines.length > PREVIEW_LINE_LIMIT || (item.details || '').length > 500;
            const previewLines = isLongLog ? lines.slice(0, PREVIEW_LINE_LIMIT).join('\n') : item.details;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.targetSection) {
                    onNavigate?.(item.targetSection);
                  } else if (hasDetails) {
                    setExpandedItemId(isExpanded ? null : item.id);
                  }
                }}
                className={`py-3 transition-colors ${
                  isClickable ? 'hover:bg-elevated/40 cursor-pointer' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border shrink-0 mt-0.5 sm:mt-0 ${
                        item.type === 'audit_err'
                          ? 'bg-danger/10 border-danger/30'
                          : item.type === 'audit_warn'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-elevated border-subtle'
                      }`}
                    >
                      {getIcon(item)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold truncate ${
                            item.type === 'audit_err'
                              ? 'text-danger'
                              : item.type === 'audit_warn'
                              ? 'text-amber-500'
                              : 'text-fg-primary'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.2 text-[9px] font-mono ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                        {item.targetSection && (
                          <span className="text-[10px] text-accent hover:underline font-medium hidden sm:inline">
                            Open {item.targetSection} →
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-fg-muted mt-0.5 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp with Date and Time and Expand Caret */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 sm:pl-3">
                    <span className="font-mono text-[10px] text-fg-muted">
                      {formatDateTime(item.timestamp)}
                    </span>
                    {hasDetails && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedItemId(isExpanded ? null : item.id);
                        }}
                        className="text-fg-muted hover:text-fg-primary p-0.5 rounded cursor-pointer"
                        title={isExpanded ? 'Hide diagnostic details' : 'View diagnostic status & root cause'}
                      >
                        {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Diagnostic Summary & Technical Audit Details Drawer */}
                {isExpanded && hasDetails && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/30 dark:bg-black/50 border border-subtle text-[11px] text-fg-secondary space-y-2.5 relative group">
                    {/* Human-Readable Diagnostic Summary (Shared API Status Catalog) */}
                    {(item.rootCause || item.resolution) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-elevated/50 border border-subtle font-sans">
                        {item.rootCause && (
                          <div>
                            <div className="text-[9.5px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                              Root Cause (Why This Occurred)
                            </div>
                            <p className="text-[11px] text-fg-primary mt-0.5 leading-relaxed">
                              {item.rootCause}
                            </p>
                          </div>
                        )}
                        {item.resolution && (
                          <div>
                            <div className="text-[9.5px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                              Recommended Resolution
                            </div>
                            <p className="text-[11px] text-fg-primary mt-0.5 leading-relaxed">
                              {item.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Raw Technical Audit Log (if present) */}
                    {item.details && (
                      <div className="font-mono space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-fg-muted pb-1 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span>RAW TECHNICAL TRACE:</span>
                            <span>Level: {item.level?.toUpperCase()}</span>
                            {isLongLog && (
                              <span className="text-amber-400 text-[9.5px]">
                                ({lines.length} lines · preview truncated)
                              </span>
                            )}
                          </div>

                          {/* Top Right Action Tools: Icon-Only Inspect Button & Copy Button */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLog(item.details || '');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                              title="Copy entire log to clipboard"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveLogModalItem(item);
                              }}
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent transition-colors cursor-pointer"
                              title="View complete log (inspect & search)"
                            >
                              <CornersOut size={12} weight="bold" />
                            </button>
                          </div>
                        </div>

                        {/* Code Snippet with ... truncation if long */}
                        <pre className="whitespace-pre-wrap break-all text-[10px] leading-relaxed text-fg-primary select-text">
                          {previewLines}
                          {isLongLog && (
                            <div className="mt-1 text-amber-400 font-sans italic text-[10px] flex items-center justify-between pt-1 border-t border-white/5">
                              <span>... [{lines.length - PREVIEW_LINE_LIMIT} additional lines hidden in preview]</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLogModalItem(item);
                                }}
                                className="underline font-semibold cursor-pointer text-accent hover:text-accent-fg"
                              >
                                Click &quot;Full View&quot; to inspect complete log →
                              </button>
                            </div>
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar at the bottom of Activity Feed */}
      {totalFiltered > PAGE_SIZE && (
        <PaginationBar
          currentPage={currentPage}
          totalItems={totalFiltered}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="events"
        />
      )}
    </div>
  );
};
