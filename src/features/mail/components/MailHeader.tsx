import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowsDownUp,
  Check,
  CloudCheck,
  Database,
  FolderPlus,
  FolderSimple,
  Funnel,
  Gear,
  ListBullets,
  MagnifyingGlass,
  Plus,
  Pulse,
  X,
} from '@phosphor-icons/react';
import { useServiceBadgeStyle } from '../context/ServiceBadgeStyleContext';
import {
  DEFAULT_MAIL_FILTERS,
  MailActivityFilter,
  MailFilterState,
  MailSortOrder,
  MailStatusFilter,
  MailViewMode,
  ServiceBadgeStyle,
} from '../types/mail.types';

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
  sortOrder?: MailSortOrder;
  onSortOrderChange?: (order: MailSortOrder) => void;
  filters?: MailFilterState;
  onFilterChange?: (filters: MailFilterState) => void;
  availableDomains?: string[];
  availableServices?: string[];
}

const BADGE_STYLE_OPTIONS: Array<{ value: ServiceBadgeStyle; label: string }> = [
  { value: 'icon', label: 'Icon Only' },
  { value: 'both', label: 'Icon & Name' },
  { value: 'name', label: 'Name Only' },
];

const SORT_OPTIONS: Array<{ value: MailSortOrder; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'email-asc', label: 'Email (A → Z)' },
  { value: 'email-desc', label: 'Email (Z → A)' },
];

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
  sortOrder = 'newest',
  onSortOrderChange,
  filters = DEFAULT_MAIL_FILTERS,
  onFilterChange,
  availableDomains = [],
  availableServices = [],
}) => {
  const { badgeStyle, setBadgeStyle } = useServiceBadgeStyle();
  const [isBadgeMenuOpen, setIsBadgeMenuOpen] = useState(false);
  const badgeMenuRef = useRef<HTMLDivElement>(null);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const isFilterActive =
    filters.status !== 'all' ||
    filters.activity !== 'all' ||
    filters.domain !== 'all' ||
    filters.service !== 'all';

  const hasUnreadActivity = unreadActivityCount > 0;

  useEffect(() => {
    if (!isBadgeMenuOpen && !isFilterMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (badgeMenuRef.current && !badgeMenuRef.current.contains(target)) {
        setIsBadgeMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBadgeMenuOpen, isFilterMenuOpen]);

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

        {/* Right side controls: Search Email Input with embedded Filter Popover + Service Badge Style Gear */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {/* Search Email Input with embedded Filter icon and dropdown */}
          <div className="relative flex items-center flex-1 sm:w-80" ref={filterMenuRef}>
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
              className="w-full rounded-lg bg-surface hover:bg-elevated focus:bg-surface-solid pl-8 pr-16 py-1.5 text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-sky-500/50 focus:outline-none transition-colors"
            />
            {/* Embedded buttons inside right side of search bar */}
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  title="Clear search"
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-fg-muted hover:text-fg-primary cursor-pointer"
                >
                  <X size={12} weight="bold" />
                </button>
              )}

              {/* Filter & Sort Button inside search bar */}
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                title={`Filters & Sort${isFilterActive ? ' (Active)' : ''}`}
                aria-label="Filter and sort accounts"
                aria-expanded={isFilterMenuOpen}
                className={`relative inline-flex h-6 w-6 items-center justify-center rounded-md transition-all cursor-pointer ${
                  isFilterMenuOpen || isFilterActive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-xs'
                    : 'text-fg-muted hover:text-fg-primary hover:bg-elevated'
                }`}
              >
                <Funnel size={13} weight={isFilterActive ? 'fill' : 'bold'} />
                {isFilterActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-surface" />
                )}
              </button>
            </div>

            {/* Filter & Sort Popover Dropdown */}
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-default bg-surface-solid/95 backdrop-blur-md p-3 shadow-2xl z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-default">
                  <div className="flex items-center gap-1.5">
                    <Funnel size={13} weight="bold" className="text-sky-400" />
                    <span className="text-xs font-semibold text-fg-primary">
                      Filters & Sort
                    </span>
                  </div>
                  {(isFilterActive || (sortOrder && sortOrder !== 'newest')) && (
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange?.(DEFAULT_MAIL_FILTERS);
                        onSortOrderChange?.('newest');
                      }}
                      className="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Sort Order */}
                {viewMode !== 'activity' && onSortOrderChange && (
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                      <ArrowsDownUp size={11} weight="bold" />
                      <span>Sort By</span>
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = sortOrder === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onSortOrderChange(opt.value)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer border ${
                              isSelected
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                            }`}
                          >
                            <span className="truncate">{opt.label}</span>
                            {isSelected && (
                              <Check size={12} weight="bold" className="text-sky-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status / Forwarding Filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                    Routing Status
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'forwarding', label: 'Forwarding' },
                      { value: 'vault', label: 'Vault Only' },
                    ].map((opt) => {
                      const isSelected = filters.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            onFilterChange?.({
                              ...filters,
                              status: opt.value as MailStatusFilter,
                            })
                          }
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activity / Messages Filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                    Activity Messages
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'with-activity', label: 'Active' },
                      { value: 'no-activity', label: 'Empty' },
                    ].map((opt) => {
                      const isSelected = filters.activity === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            onFilterChange?.({
                              ...filters,
                              activity: opt.value as MailActivityFilter,
                            })
                          }
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Domain Filter (if multiple domains available) */}
                {availableDomains && availableDomains.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                      Domain
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => onFilterChange?.({ ...filters, domain: 'all' })}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                          filters.domain === 'all'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                        }`}
                      >
                        All Domains
                      </button>
                      {availableDomains.map((dom) => {
                        const isSelected = filters.domain.toLowerCase() === dom.toLowerCase();
                        return (
                          <button
                            key={dom}
                            type="button"
                            onClick={() =>
                              onFilterChange?.({
                                ...filters,
                                domain: isSelected ? 'all' : dom,
                              })
                            }
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                            }`}
                          >
                            @{dom}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Service Tag Filter (if tags available) */}
                {availableServices && availableServices.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                      Detected Service
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => onFilterChange?.({ ...filters, service: 'all' })}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                          filters.service === 'all'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                        }`}
                      >
                        All Services
                      </button>
                      {availableServices.map((svc) => {
                        const isSelected = filters.service.toLowerCase() === svc.toLowerCase();
                        return (
                          <button
                            key={svc}
                            type="button"
                            onClick={() =>
                              onFilterChange?.({
                                ...filters,
                                service: isSelected ? 'all' : svc,
                              })
                            }
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-surface hover:bg-elevated text-fg-secondary hover:text-fg-primary border-transparent'
                            }`}
                          >
                            {svc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Tag Badge Display Setting (Gear Popover) */}
          <div className="relative shrink-0" ref={badgeMenuRef}>
            <button
              type="button"
              onClick={() => setIsBadgeMenuOpen(!isBadgeMenuOpen)}
              title="Service badge display settings"
              aria-label="Service badge display settings"
              aria-expanded={isBadgeMenuOpen}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                isBadgeMenuOpen
                  ? 'bg-elevated border-sky-500/50 text-sky-400 shadow-xs'
                  : 'bg-surface hover:bg-elevated border-default text-fg-secondary hover:text-fg-primary'
              }`}
            >
              <Gear
                size={15}
                weight={isBadgeMenuOpen ? 'fill' : 'bold'}
                className={`transition-transform duration-150 ${isBadgeMenuOpen ? 'rotate-45 text-sky-400' : ''}`}
              />
            </button>

            {isBadgeMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-default bg-surface-solid/95 backdrop-blur-md p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                  Service Badges
                </div>
                {BADGE_STYLE_OPTIONS.map((opt) => {
                  const isSelected = badgeStyle === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setBadgeStyle(opt.value);
                        setIsBadgeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 text-sky-400 font-semibold'
                          : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check size={13} weight="bold" className="text-sky-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
