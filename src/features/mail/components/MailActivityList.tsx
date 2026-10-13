import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowsClockwise,
  Check,
  Checks,
  EnvelopeOpen,
  EnvelopeSimple,
  PaperPlaneTilt,
  Tray,
} from '@phosphor-icons/react';
import { PaginationBar } from '../../../shared/components/pagination';
import { MailActivityItem } from '../types/mail-inbox.types';
import { isVaultDestination } from '../types/mail.types';

const DESKTOP_PAGE_SIZE = 9;

function computeAutoPageSize(): number {
  if (typeof window === 'undefined') return DESKTOP_PAGE_SIZE;
  if (window.innerWidth >= 640) {
    return DESKTOP_PAGE_SIZE;
  }
  const availableForCards = window.innerHeight - 340;
  const fit = Math.floor(availableForCards / 64);
  return Math.max(4, Math.min(fit, 6));
}

interface MailActivityListProps {
  items: MailActivityItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  searchQuery?: string;
  onSelectActivity: (item: MailActivityItem) => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

export const MailActivityList: React.FC<MailActivityListProps> = ({
  items,
  isLoading,
  isRefreshing,
  searchQuery = '',
  onSelectActivity,
  onMarkAllRead,
  onRefresh,
}) => {
  const [pageSize, setPageSize] = useState(computeAutoPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const unreadCount = items.filter((i) => !i.isRead).length;

  useEffect(() => {
    const handleResize = () => {
      setPageSize(computeAutoPageSize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const safePage = Math.min(currentPage, totalPages);
  const visibleItems = items.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="flex-1 flex flex-col justify-between rounded-xl bg-surface backdrop-blur-xl border border-default shadow-card overflow-hidden">
      <div>
        {/* Toolbar / Table Header */}
        <div className="flex items-center justify-between gap-3 border-b border-default bg-elevated/60 px-4 py-2.5">
          <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 flex-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            <div className="col-span-5">Incoming Email</div>
            <div className="col-span-4">Routing (Alias → Target)</div>
            <div className="col-span-3 text-right">Received / Result</div>
          </div>

          <div className="flex sm:hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            <span>Incoming Activity</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                title="Tag all incoming emails as read"
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/35 bg-emerald-500/12 hover:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors cursor-pointer"
              >
                <Checks size={13} weight="bold" />
                <span className="leading-none">Mark all read</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh activity feed"
              className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-default bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise
                size={13}
                weight="bold"
                className={`inline-block ${isRefreshing ? 'animate-spin text-accent' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Activity Rows */}
        {items.length === 0 ? (
          <div className="px-4 py-14 text-center text-xs text-fg-muted">
            {isLoading
              ? 'Loading incoming email activity...'
              : searchQuery.trim()
                ? `No activity matching "${searchQuery.trim()}".`
                : 'No incoming email activity recorded yet.'}
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {visibleItems.map((item, index) => {
              const isNoneTarget = isVaultDestination(item.forwardTo);
              const isUnread = !item.isRead;

              return (
                <div
                  key={`${item.id}_p${safePage}_${index}`}
                  onClick={() => onSelectActivity(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectActivity(item);
                    }
                  }}
                  title={
                    isNoneTarget
                      ? 'Click to open Inbox and read email'
                      : 'Click to mark forwarded activity as read'
                  }
                  className={`group transition-all duration-150 cursor-pointer ${
                    isUnread
                      ? 'border-l-2 border-l-emerald-500 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.10]'
                      : 'hover:bg-elevated/55'
                  }`}
                >
                  {/* ========================================================= */}
                  {/* 1. DEDICATED MOBILE ACTIVITY ITEM (< sm)                  */}
                  {/* Organized 3-line compact card with zero cluttered wrapping */}
                  {/* ========================================================= */}
                  <div className="flex sm:hidden items-start gap-2.5 px-3 py-2.5 w-full min-w-0">
                    {/* Left: Icon */}
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        !isNoneTarget
                          ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400'
                          : isUnread
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : 'border-default bg-elevated text-fg-muted'
                      }`}
                    >
                      {!isNoneTarget ? (
                        <PaperPlaneTilt size={13} weight="duotone" />
                      ) : isUnread ? (
                        <EnvelopeSimple size={13} weight="fill" />
                      ) : (
                        <EnvelopeOpen size={13} weight="duotone" />
                      )}
                    </div>

                    {/* Right: Structured Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Line 1: Sender Name & Timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          {isUnread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          )}
                          <span
                            className={`truncate text-xs ${
                              isUnread
                                ? 'font-semibold text-fg-primary'
                                : 'font-medium text-fg-secondary'
                            }`}
                          >
                            {item.senderName || item.sender}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-fg-muted shrink-0">
                          {item.receivedDate} · {item.receivedTime}
                        </span>
                      </div>

                      {/* Line 2: Subject */}
                      <p
                        className={`truncate text-xs leading-snug ${
                          isUnread ? 'font-medium text-fg-primary' : 'text-fg-muted'
                        }`}
                      >
                        {item.subject || '(No subject)'}
                      </p>

                      {/* Line 3: Routing Destination & Status Pill */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* Clean routing pill */}
                        <div className="min-w-0 flex items-center gap-1 text-[10px] font-mono text-fg-muted truncate">
                          <span className="truncate max-w-[110px] text-fg-secondary font-medium">
                            {item.recipientEmail}
                          </span>
                          <ArrowRight size={9} className="shrink-0 text-fg-muted" />
                          {isNoneTarget ? (
                            <span className="inline-flex items-center gap-1 rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-fg-secondary shrink-0">
                              <Tray size={10} weight="duotone" className="text-accent" />
                              <span>Inbox</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-surface border border-default px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 truncate max-w-[130px]">
                              <PaperPlaneTilt size={9} weight="duotone" className="shrink-0" />
                              <span className="truncate">{item.forwardTo}</span>
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isNoneTarget ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                isUnread
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-elevated text-fg-secondary border border-default'
                              }`}
                            >
                              <Tray size={10} weight="bold" />
                              <span>Inbox</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/35 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                              <Check size={10} weight="bold" />
                              <span>Forwarded</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 2. DEDICATED DESKTOP ACTIVITY ROW (>= sm)                 */}
                  {/* 100% original wide 12-column table grid                    */}
                  {/* ========================================================= */}
                  <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 px-4 py-3">
                    {/* Column 1: Sender & Subject */}
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          !isNoneTarget
                            ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400'
                            : isUnread
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                            : 'border-default bg-elevated text-fg-muted'
                        }`}
                      >
                        {!isNoneTarget ? (
                          <PaperPlaneTilt size={14} weight="duotone" />
                        ) : isUnread ? (
                          <EnvelopeSimple size={14} weight="fill" />
                        ) : (
                          <EnvelopeOpen size={14} weight="duotone" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isUnread && (
                            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          )}
                          <span
                            className={`truncate text-xs ${
                              isUnread
                                ? 'font-semibold text-fg-primary'
                                : 'font-medium text-fg-secondary'
                            }`}
                          >
                            {item.senderName}
                          </span>
                          <span className="truncate text-[11px] font-mono text-fg-muted">
                            &lt;{item.sender}&gt;
                          </span>
                        </div>

                        <p
                          className={`mt-0.5 truncate text-xs ${
                            isUnread
                              ? 'font-medium text-fg-primary'
                              : 'text-fg-muted'
                          }`}
                        >
                          {item.subject}
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Routing (Alias -> Destination / None) */}
                    <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                      <span className="truncate font-mono text-[11px] font-medium text-fg-primary max-w-[160px]">
                        {item.recipientEmail}
                      </span>
                      <ArrowRight
                        size={11}
                        weight="bold"
                        className="shrink-0 text-fg-muted"
                      />
                      {isNoneTarget ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-default bg-elevated px-2 py-0.5 text-[11px] font-medium text-fg-secondary">
                          <Tray size={12} weight="duotone" className="text-accent" />
                          <span>Vault</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-default bg-surface px-2 py-0.5 text-[11px] font-mono text-fg-secondary max-w-[180px] truncate">
                          <PaperPlaneTilt
                            size={11}
                            weight="duotone"
                            className="shrink-0 text-emerald-400"
                          />
                          <span className="truncate">{item.forwardTo}</span>
                        </span>
                      )}
                    </div>

                    {/* Column 3: Timestamp & Action/Read Pill */}
                    <div className="col-span-3 flex items-center justify-end gap-2.5">
                      <div className="text-right leading-tight">
                        <div className="text-[11px] font-medium text-fg-secondary">
                          {item.receivedDate}
                        </div>
                        <div className="text-[10px] font-mono text-fg-muted">
                          {item.receivedTime}
                        </div>
                      </div>

                      {isNoneTarget ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors shrink-0 ${
                            isUnread
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-elevated text-fg-secondary border border-default group-hover:text-fg-primary'
                          }`}
                        >
                          <Tray size={12} weight="bold" />
                          <span>Inbox</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-1 text-[11px] font-medium text-emerald-400 shrink-0">
                          <Check size={11} weight="bold" />
                          <span>Forwarded</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <PaginationBar
          currentPage={safePage}
          totalItems={items.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="activities"
        />
      )}
    </div>
  );
};
