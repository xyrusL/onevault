import React from 'react';
import {
  ArrowsClockwise,
  Globe,
  Table,
} from '@phosphor-icons/react';

interface DomainsHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  showOverviewTable: boolean;
  onToggleOverviewTable: () => void;
}

export const DomainsHeader: React.FC<DomainsHeaderProps> = ({
  onRefresh,
  isRefreshing,
  showOverviewTable,
  onToggleOverviewTable,
}) => {
  return (
    <header className="flex items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-subtle">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
          <Globe size={19} weight="duotone" />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-base sm:text-xl font-bold tracking-tight text-fg-primary truncate">
            Domain Management
          </h1>
          <p className="mt-0.5 text-[11px] sm:text-xs text-fg-secondary truncate">
            <span className="sm:hidden">Cloudflare DNS & subdomain routing</span>
            <span className="hidden sm:inline">
              Manage web domains, subdomains, and Cloudflare DNS records with instant updates.
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleOverviewTable}
          title="Toggle domain directory overview table"
          className={`flex h-8 sm:h-8.5 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all cursor-pointer ${
            showOverviewTable
              ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
              : 'bg-elevated border border-default text-fg-secondary hover:text-fg-primary hover:border-strong'
          }`}
        >
          <Table size={14} weight="duotone" />
          <span className="hidden md:inline">{showOverviewTable ? 'Hide Domains Table' : 'All Domains Table'}</span>
          <span className="hidden sm:inline md:hidden">Table</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh domain data"
          className="flex h-8 w-8 sm:h-8.5 sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-default bg-elevated sm:px-2.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowsClockwise
            size={14}
            weight="bold"
            className={isRefreshing ? 'animate-spin text-accent' : ''}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};
