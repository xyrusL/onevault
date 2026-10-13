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
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-subtle">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
          <Globe size={20} weight="duotone" />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary truncate">
            Domain Management
          </h1>
          <p className="mt-0.5 text-xs text-fg-secondary truncate">
            Manage web domains, subdomains, and Cloudflare DNS records with instant updates.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleOverviewTable}
          title="Toggle domain directory overview table"
          className={`flex h-8.5 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all cursor-pointer ${
            showOverviewTable
              ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
              : 'bg-elevated border border-default text-fg-secondary hover:text-fg-primary hover:border-strong'
          }`}
        >
          <Table size={14} weight="duotone" />
          <span className="hidden md:inline">{showOverviewTable ? 'Hide Domains Table' : 'All Domains Table'}</span>
          <span className="md:hidden">Table</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh domain data"
          className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg border border-default bg-elevated px-2.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-all cursor-pointer disabled:opacity-50"
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
