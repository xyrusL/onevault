import React from 'react';
import {
  CloudCheck,
  Database,
  FolderPlus,
  FolderSimple,
  ListBullets,
  MagnifyingGlass,
  Plus,
  Pulse,
  X,
} from '@phosphor-icons/react';
import { MailViewMode } from '../types/mail.types';

interface MailHeaderProps {
  viewMode: MailViewMode;
  onViewModeChange: (mode: MailViewMode) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  onCreateSubdomainClick: () => void;
  totalEmailsCount: number;
  totalFoldersCount: number;
  totalActivityCount: number;
  unreadActivityCount: number;
}

export const MailHeader: React.FC<MailHeaderProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onCreateSubdomainClick,
  totalEmailsCount,
  totalFoldersCount,
  totalActivityCount,
  unreadActivityCount,
}) => {
  const hasUnreadActivity = unreadActivityCount > 0;

  return (
    <header className="flex flex-col gap-3">
      {/* Top Row: Page Title + Live Badge + Status Pills and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary leading-tight">
              Mail
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Routing Active
            </span>
          </div>
          <p className="mt-0.5 text-xs text-fg-secondary">
            Primary encrypted mailbox management, domain folders, and live alias routing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Cloudflare Email Routing status pill (Desktop) */}
          <div className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg-secondary shadow-2xs shrink-0">
            <CloudCheck size={14} weight="duotone" className="text-sky-400 shrink-0" />
            <span>
              Relay: <strong className="text-fg-primary font-semibold">Cloudflare</strong>
            </span>
          </div>

          {/* D1 Inbox Storage pill (Desktop) */}
          <div className="hidden xl:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg-secondary shadow-2xs shrink-0">
            <Database size={14} weight="duotone" className="text-cyan-400 shrink-0" />
            <span>
              Inbox: <strong className="text-fg-primary font-semibold">D1 Connected</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
            {/* New Subdomain Action */}
            <button
              type="button"
              onClick={onCreateSubdomainClick}
              title="Create a dedicated subdomain for email routing"
              className="inline-flex justify-center items-center gap-1.5 rounded-lg border border-default bg-elevated hover:bg-surface-solid hover:border-strong px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-fg-secondary hover:text-fg-primary shadow-xs transition-all duration-150 cursor-pointer"
            >
              <FolderPlus size={14} weight="duotone" className="text-fg-muted" />
              <span className="leading-none">New Subdomain</span>
            </button>

            {/* New Email Action */}
            <button
              type="button"
              onClick={onCreateClick}
              className="group inline-flex justify-center items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-3 py-2 sm:py-1.5 text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
            >
              <Plus
                size={14}
                weight="bold"
                className="transition-transform duration-200 group-hover:rotate-90"
              />
              <span className="leading-none">New Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Toolbar: View Switcher (All Addresses | Folders | Activity) and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-0.5">
        {/* View Mode Toggle: All Addresses vs Folders vs Activity */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-default w-full sm:w-auto shrink-0 overflow-x-auto flex-nowrap scrollbar-none">
          {/* All Addresses Tab (Sky Accent when active) */}
          <button
            type="button"
            onClick={() => onViewModeChange('all')}
            className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
              viewMode === 'all'
                ? 'bg-sky-500/18 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.22)]'
                : 'text-fg-secondary hover:text-fg-primary border border-transparent'
            }`}
          >
            <ListBullets
              size={14}
              weight="bold"
              className={viewMode === 'all' ? 'text-sky-400' : 'text-sky-400/75'}
            />
            <span className="whitespace-nowrap">All Addresses</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'all'
                  ? 'bg-sky-500/25 text-sky-300'
                  : 'bg-elevated text-fg-secondary'
              }`}
            >
              {totalEmailsCount}
            </span>
          </button>

          {/* Folders Tab (Indigo Accent when active) */}
          <button
            type="button"
            onClick={() => onViewModeChange('folders')}
            className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
              viewMode === 'folders'
                ? 'bg-indigo-500/18 text-indigo-400 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.22)]'
                : 'text-fg-secondary hover:text-fg-primary border border-transparent'
            }`}
          >
            <FolderSimple
              size={14}
              weight="duotone"
              className={viewMode === 'folders' ? 'text-indigo-400' : 'text-indigo-400/75'}
            />
            <span className="whitespace-nowrap">Folders</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                viewMode === 'folders'
                  ? 'bg-indigo-500/25 text-indigo-300'
                  : 'bg-elevated text-fg-secondary'
              }`}
            >
              {totalFoldersCount}
            </span>
          </button>

          {/* Activity Tab — Colors Green ONLY when there are unread incoming emails */}
          <button
            type="button"
            onClick={() => onViewModeChange('activity')}
            className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
              hasUnreadActivity
                ? viewMode === 'activity'
                  ? 'bg-emerald-500/22 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.28)]'
                  : 'bg-emerald-500/14 text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/22 shadow-[0_0_10px_rgba(16,185,129,0.18)]'
                : viewMode === 'activity'
                  ? 'bg-elevated text-fg-primary shadow-xs border border-subtle'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
            }`}
          >
            {hasUnreadActivity ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <Pulse size={14} weight="bold" />
            )}
            <span className="whitespace-nowrap">Activity</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                hasUnreadActivity
                  ? 'bg-emerald-500/25 text-emerald-300 font-semibold'
                  : 'bg-elevated text-fg-secondary'
              }`}
            >
              {hasUnreadActivity ? unreadActivityCount : totalActivityCount}
            </span>
          </button>
        </div>

        {/* Search Email Input */}
        <div className="relative flex items-center w-full sm:w-72">
          <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-sky-400/80">
            <MagnifyingGlass size={14} weight="bold" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              viewMode === 'activity'
                ? 'Search sender, subject, alias...'
                : 'Search email | note...'
            }
            aria-label="Search email addresses"
            className="w-full rounded-lg bg-surface hover:bg-elevated focus:bg-surface-solid pl-8 pr-7 py-1.5 text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-sky-500/50 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Clear search"
              className="absolute right-2 inline-flex h-4 w-4 items-center justify-center rounded text-fg-muted hover:text-fg-primary cursor-pointer"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
