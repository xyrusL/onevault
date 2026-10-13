import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowSquareOut,
  Check,
  Copy,
  Globe,
  HardDrives,
  Trash,
  TreeStructure,
} from '@phosphor-icons/react';
import type { DomainItem } from '../../types/domains.types';

interface DomainCardProps {
  domain: DomainItem;
  onSelect: (domain: DomainItem) => void;
  onRequestDelete: (domain: DomainItem) => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  onSelect,
  onRequestDelete,
}) => {
  const [copiedNs, setCopiedNs] = useState(false);

  const handleCopyNameservers = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!domain.nameServers?.length) return;
    navigator.clipboard.writeText(domain.nameServers.join(', '));
    setCopiedNs(true);
    setTimeout(() => setCopiedNs(false), 2000);
  };

  const isPending = domain.status === 'pending';

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-default bg-surface hover:border-strong hover:shadow-card transition-all duration-200 p-4">
      {/* Top: Name & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated border border-subtle text-accent group-hover:border-accent/40 transition-colors">
              <Globe size={18} weight="duotone" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-fg-primary truncate">
                  {domain.name}
                </span>
                <a
                  href={`https://${domain.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Visit website"
                  className="text-fg-muted hover:text-accent transition-colors"
                >
                  <ArrowSquareOut size={13} weight="bold" />
                </a>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider ${
                    isPending
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isPending ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  {domain.status}
                </span>

                <span className="rounded px-1.5 py-0.2 text-[10px] font-mono text-fg-muted bg-elevated border border-subtle">
                  {domain.source === 'cloudflare' ? 'Cloudflare Zone' : 'Custom Web Domain'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(domain);
            }}
            title="Delete domain"
            className="rounded p-1.5 text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors cursor-pointer"
          >
            <Trash size={14} weight="bold" />
          </button>
        </div>

        {/* Nameservers preview */}
        <div className="mt-3.5 rounded-lg border border-subtle bg-elevated/40 p-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-fg-muted font-medium mb-1">
            <span>Cloudflare Nameservers</span>
            <button
              type="button"
              onClick={handleCopyNameservers}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-fg-secondary hover:text-accent cursor-pointer"
            >
              {copiedNs ? (
                <>
                  <Check size={11} weight="bold" className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={11} weight="bold" />
                  <span>Copy NS</span>
                </>
              )}
            </button>
          </div>
          <div className="space-y-0.5 font-mono text-[11px] text-fg-secondary truncate">
            {domain.nameServers?.length > 0 ? (
              domain.nameServers.map((ns) => (
                <div key={ns} className="truncate select-all">
                  • {ns}
                </div>
              ))
            ) : (
              <span className="text-fg-muted">Standard Cloudflare DNS</span>
            )}
          </div>
        </div>

        {/* Telemetry pill row */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2 rounded-lg border border-subtle bg-surface p-2">
            <TreeStructure size={15} weight="duotone" className="text-blue-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-fg-muted block leading-none">Subdomains</span>
              <span className="text-xs font-bold text-fg-primary block mt-0.5">
                {domain.subdomainCount} configured
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-subtle bg-surface p-2">
            <HardDrives size={15} weight="duotone" className="text-purple-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-fg-muted block leading-none">DNS Records</span>
              <span className="text-xs font-bold text-fg-primary block mt-0.5">
                {domain.recordCount} total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="mt-4 pt-3 border-t border-subtle">
        <button
          type="button"
          onClick={() => onSelect(domain)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-default bg-elevated/70 py-2 text-xs font-semibold text-fg-primary hover:bg-accent hover:text-accent-fg hover:border-accent transition-all duration-150 cursor-pointer"
        >
          <span>Manage DNS & Subdomains</span>
          <ArrowRight size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
};
