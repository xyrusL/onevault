import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowSquareOut,
  Check,
  Copy,
  Globe,
  HardDrives,
  Plus,
  Trash,
  TreeStructure,
} from '@phosphor-icons/react';
import type { DomainItem } from '../../types/domains.types';

interface DomainListProps {
  domains: DomainItem[];
  selectedDomain: DomainItem | null;
  onSelectDomain: (domain: DomainItem) => void;
  onRequestDelete: (domain: DomainItem) => void;
  onOpenCreateRecordForDomain: (domain: DomainItem) => void;
}

export const DomainList: React.FC<DomainListProps> = ({
  domains,
  selectedDomain,
  onSelectDomain,
  onRequestDelete,
  onOpenCreateRecordForDomain,
}) => {
  const [copiedDomainName, setCopiedDomainName] = useState<string | null>(null);

  const handleCopyNs = (e: React.MouseEvent, domain: DomainItem) => {
    e.stopPropagation();
    if (!domain.nameServers?.length) return;
    navigator.clipboard.writeText(domain.nameServers.join(', '));
    setCopiedDomainName(domain.name);
    setTimeout(() => setCopiedDomainName(null), 2000);
  };

  return (
    <div className="rounded-xl border border-default bg-surface overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-subtle bg-elevated/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Globe size={17} weight="duotone" className="text-accent" />
          <h2 className="text-xs sm:text-sm font-bold text-fg-primary">
            Domains List ({domains.length})
          </h2>
          <span className="text-[11px] text-fg-muted hidden sm:inline">
            — Select a domain to manage its subdomains and DNS records
          </span>
        </div>
      </div>

      {domains.length > 0 ? (
        <>
          {/* MOBILE DEDICATED DOMAIN CARDS (< md) */}
          <div className="md:hidden divide-y divide-subtle">
            {domains.map((domain) => {
              const isSelected = selectedDomain?.name === domain.name;
              const isCopied = copiedDomainName === domain.name;

              return (
                <div
                  key={domain.id || domain.name}
                  onClick={() => onSelectDomain(domain)}
                  className={`flex flex-col gap-2 p-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent/10 border-l-3 border-l-accent'
                      : 'hover:bg-elevated/40'
                  }`}
                >
                  {/* Row 1: Domain Name + Status + Quick Actions */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-accent text-accent-fg border-accent'
                            : 'bg-elevated text-fg-secondary border-subtle'
                        }`}
                      >
                        <Globe size={14} weight="duotone" />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-display font-bold text-xs text-fg-primary truncate">
                          {domain.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {domain.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateRecordForDomain(domain);
                        }}
                        title="Add record"
                        aria-label="Add record"
                        className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-default bg-elevated text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
                      >
                        <Plus size={12} weight="bold" />
                      </button>

                      <a
                        href={`https://${domain.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`Visit https://${domain.name}`}
                        className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-subtle bg-elevated/70 text-fg-muted hover:text-accent transition-colors"
                      >
                        <ArrowSquareOut size={12} weight="bold" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete(domain);
                        }}
                        title="Delete domain"
                        aria-label="Delete domain"
                        className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-subtle bg-elevated/70 text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      >
                        <Trash size={12} weight="bold" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Stats Pills + Nameserver Copy */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1 rounded bg-elevated border border-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-secondary shrink-0">
                        <TreeStructure size={11} weight="duotone" className="text-blue-400" />
                        <span>{domain.subdomainCount}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-elevated border border-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-secondary shrink-0">
                        <HardDrives size={11} weight="duotone" className="text-purple-400" />
                        <span>{domain.recordCount}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] text-fg-muted truncate">
                        {domain.nameServers?.[0] || 'Cloudflare DNS'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyNs(e, domain)}
                        title="Copy Nameservers"
                        className="rounded p-0.5 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer shrink-0"
                      >
                        {isCopied ? (
                          <Check size={11} weight="bold" className="text-emerald-400" />
                        ) : (
                          <Copy size={11} weight="bold" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP OVERVIEW TABLE (md: and above) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-default bg-elevated/60 text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
                  <th className="px-4 py-2.5">Domain</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Cloudflare Nameservers</th>
                  <th className="px-4 py-2.5">Subdomains</th>
                  <th className="px-4 py-2.5">DNS Records</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => {
                  const isSelected = selectedDomain?.name === domain.name;
                  const isCopied = copiedDomainName === domain.name;

                  return (
                    <tr
                      key={domain.id || domain.name}
                      onClick={() => onSelectDomain(domain)}
                      className={`border-b border-subtle transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent/10 border-l-4 border-l-accent'
                          : 'hover:bg-elevated/40'
                      }`}
                    >
                      {/* Domain Name */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-accent text-accent-fg border-accent'
                                : 'bg-elevated text-fg-secondary border-subtle'
                            }`}
                          >
                            <Globe size={16} weight="duotone" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display font-bold text-xs text-fg-primary truncate">
                                {domain.name}
                              </span>
                              <a
                                href={`https://${domain.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Visit https://${domain.name}`}
                                className="text-fg-muted hover:text-accent transition-colors"
                              >
                                <ArrowSquareOut size={12} weight="bold" />
                              </a>
                            </div>
                            <span className="text-[10px] font-mono text-fg-muted">
                              {domain.source === 'cloudflare' ? 'Cloudflare Zone' : 'Custom Domain'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {domain.status}
                        </span>
                      </td>

                      {/* Nameservers */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 max-w-xs">
                          <div className="space-y-0.5 font-mono text-[11px] text-fg-secondary truncate">
                            {domain.nameServers?.length > 0 ? (
                              domain.nameServers.slice(0, 2).map((ns) => (
                                <div key={ns} className="truncate select-all">
                                  {ns}
                                </div>
                              ))
                            ) : (
                              <span className="text-fg-muted">Auto Cloudflare DNS</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleCopyNs(e, domain)}
                            title="Copy Nameservers"
                            className="rounded p-1 text-fg-muted hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer shrink-0"
                          >
                            {isCopied ? (
                              <Check size={12} weight="bold" className="text-emerald-400" />
                            ) : (
                              <Copy size={12} weight="bold" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Subdomains Count */}
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-elevated border border-subtle px-2 py-0.5 text-[11px] font-medium text-fg-secondary">
                          <TreeStructure size={13} weight="duotone" className="text-blue-400" />
                          <span>{domain.subdomainCount} subdomains</span>
                        </span>
                      </td>

                      {/* Records Count */}
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-elevated border border-subtle px-2 py-0.5 text-[11px] font-medium text-fg-secondary">
                          <HardDrives size={13} weight="duotone" className="text-purple-400" />
                          <span>{domain.recordCount} records</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCreateRecordForDomain(domain);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-default bg-elevated px-2 py-1 text-[11px] font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-colors cursor-pointer"
                          >
                            <Plus size={11} weight="bold" />
                            <span>Subdomain</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDomain(domain);
                            }}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-accent text-accent-fg'
                                : 'bg-elevated border border-default text-fg-primary hover:bg-hover'
                            }`}
                          >
                            <span>{isSelected ? 'Viewing Records' : 'Manage Records'}</span>
                            <ArrowRight size={11} weight="bold" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestDelete(domain);
                            }}
                            title="Delete domain"
                            className="rounded-md p-1.5 text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center p-6 space-y-3">
          <Globe size={24} weight="duotone" className="text-fg-muted" />
          <div>
            <h3 className="text-sm font-semibold text-fg-primary">
              No domains configured yet
            </h3>
            <p className="mt-1 text-xs text-fg-muted max-w-xs mx-auto">
              Your registered Cloudflare domains will automatically display here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
