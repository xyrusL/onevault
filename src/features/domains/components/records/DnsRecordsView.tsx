import React, { useMemo, useState } from 'react';
import {
  ArrowSquareOut,
  Check,
  CloudCheck,
  Copy,
  EnvelopeSimple,
  Globe,
  HardDrives,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  SquaresFour,
  TreeStructure,
  X,
} from '@phosphor-icons/react';
import { PaginationBar } from '../../../../shared/components/pagination/PaginationBar';
import type { DnsRecordType, DomainItem, DomainRecordItem } from '../../types/domains.types';
import { RecordRow } from './RecordRow';

interface DnsRecordsViewProps {
  domain: DomainItem;
  allDomains: DomainItem[];
  records: DomainRecordItem[];
  allDomainRecordsMap?: Record<string, DomainRecordItem[]>;
  isLoading: boolean;
  onSelectDomain: (domain: DomainItem) => void;
  onOpenCreateRecord: (presetSubdomain?: string, presetType?: DnsRecordType) => void;
  onEditRecord: (record: DomainRecordItem) => void;
  onDeleteRecord: (record: DomainRecordItem) => void;
}

type RecordCategory = 'websites' | 'mail' | 'all';

const PAGE_SIZE = 12;

function matchesRecordHeuristic(record: DomainRecordItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  const searchableText = [
    record.name,
    record.subdomain,
    record.domainName,
    record.type,
    record.content,
    record.comment || '',
    record.proxied ? 'proxied cdn' : 'dns only direct',
    record.locked ? 'locked cloudflare system' : '',
    record.priority !== undefined ? `priority ${record.priority}` : '',
  ]
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => searchableText.includes(token));
}

export const DnsRecordsView: React.FC<DnsRecordsViewProps> = ({
  domain,
  allDomains,
  records,
  allDomainRecordsMap = {},
  isLoading,
  onSelectDomain,
  onOpenCreateRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  const [activeCategory, setActiveCategory] = useState<RecordCategory>('websites');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');
  const [copiedNs, setCopiedNs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleCopyNs = () => {
    if (!domain.nameServers?.length) return;
    navigator.clipboard.writeText(domain.nameServers.join(', '));
    setCopiedNs(true);
    setTimeout(() => setCopiedNs(false), 2000);
  };

  // 1. Build combined records pool across all domains for global search
  const allCombinedRecords = useMemo(() => {
    const map: Record<string, DomainRecordItem[]> = {
      ...allDomainRecordsMap,
      [domain.name.toLowerCase()]: records,
    };
    const list: DomainRecordItem[] = [];
    const seen = new Set<string>();

    for (const dName of Object.keys(map)) {
      for (const r of map[dName] || []) {
        const uid = r.id || `${r.domainName}-${r.name}-${r.type}`;
        if (!seen.has(uid)) {
          seen.add(uid);
          list.push(r);
        }
      }
    }
    return list;
  }, [allDomainRecordsMap, domain.name, records]);

  // Selected pool based on search scope
  const targetPool = searchScope === 'all' ? allCombinedRecords : records;

  // 2. Separate Records by Category and apply heuristic search
  const { websiteRecords, mailRecords, allFilteredRecords, matchCountInOtherDomains } = useMemo(() => {
    const webList: DomainRecordItem[] = [];
    const mailList: DomainRecordItem[] = [];
    const allMatches: DomainRecordItem[] = [];

    for (const r of targetPool) {
      if (!matchesRecordHeuristic(r, searchQuery)) continue;

      const lowerName = r.name.toLowerCase();
      const lowerContent = r.content.toLowerCase();
      const isMail =
        r.type === 'MX' ||
        lowerContent.includes('spf.mx.cloudflare.net') ||
        lowerContent.includes('v=spf1') ||
        lowerName.includes('_dmarc') ||
        lowerName.includes('domainkey') ||
        lowerContent.includes('v=dkim1');

      if (isMail) {
        mailList.push(r);
      } else {
        webList.push(r);
      }
      allMatches.push(r);
    }

    let activeList = allMatches;
    if (activeCategory === 'websites') {
      activeList = webList;
    } else if (activeCategory === 'mail') {
      activeList = mailList;
    }

    // Check if other domains have matches when user is searching only current domain
    let othersCount = 0;
    if (searchQuery.trim() && searchScope === 'current') {
      for (const r of allCombinedRecords) {
        if (
          r.domainName.toLowerCase() !== domain.name.toLowerCase() &&
          matchesRecordHeuristic(r, searchQuery)
        ) {
          othersCount++;
        }
      }
    }

    return {
      websiteRecords: webList,
      mailRecords: mailList,
      allFilteredRecords: activeList,
      matchCountInOtherDomains: othersCount,
    };
  }, [targetPool, searchQuery, activeCategory, searchScope, allCombinedRecords, domain.name]);

  const totalPages = Math.max(1, Math.ceil(allFilteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return allFilteredRecords.slice(start, start + PAGE_SIZE);
  }, [allFilteredRecords, safePage]);

  // Subdomain count
  const subdomainsCount = useMemo(() => {
    const set = new Set<string>();
    for (const r of websiteRecords) {
      if (r.subdomain && r.subdomain !== '@' && r.name !== r.domainName) {
        set.add(r.subdomain.toLowerCase());
      }
    }
    return set.size;
  }, [websiteRecords]);

  const proxiedCount = useMemo(() => {
    return websiteRecords.filter((r) => r.proxied).length;
  }, [websiteRecords]);

  return (
    <div className="rounded-2xl border border-default bg-surface shadow-xs overflow-hidden">
      {/* 1. Sleek One-Click Domain Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-surface border-b border-default">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider shrink-0 mr-1">
            Domain:
          </span>
          {allDomains.map((d) => {
            const isSelected = d.name === domain.name;
            return (
              <button
                key={d.id || d.name}
                type="button"
                onClick={() => {
                  onSelectDomain(d);
                  setCurrentPage(1);
                  if (searchScope === 'current') {
                    // Stay on current scope for new domain
                  }
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected && searchScope === 'current'
                    ? 'bg-accent text-accent-fg shadow-xs ring-1 ring-accent-ring font-bold'
                    : 'bg-elevated/70 border border-subtle text-fg-secondary hover:text-fg-primary hover:bg-elevated'
                }`}
              >
                <Globe size={14} weight="duotone" className="shrink-0" />
                <span>{d.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected && searchScope === 'current'
                      ? 'bg-accent-fg/20 text-accent-fg font-bold'
                      : 'bg-surface text-fg-muted'
                  }`}
                >
                  {d.recordCount > 0 ? d.recordCount : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Domain Nameservers & Apex Link */}
        <div className="flex items-center gap-2 text-xs font-mono text-fg-muted shrink-0 self-start sm:self-auto">
          <span className="text-[11px] text-fg-muted hidden md:inline">NS:</span>
          <span className="rounded bg-elevated border border-subtle px-2 py-0.5 text-[11px] text-fg-secondary select-all">
            {domain.nameServers?.[0] || 'Cloudflare DNS'}
          </span>
          <button
            type="button"
            onClick={handleCopyNs}
            className="text-fg-muted hover:text-accent cursor-pointer p-1 rounded hover:bg-elevated transition-colors"
            title="Copy all nameservers"
          >
            {copiedNs ? (
              <Check size={12} weight="bold" className="text-emerald-400" />
            ) : (
              <Copy size={12} weight="bold" />
            )}
          </button>
          <a
            href={`https://${domain.name}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Visit site"
            className="text-fg-muted hover:text-accent p-1 rounded hover:bg-elevated transition-colors"
          >
            <ArrowSquareOut size={13} weight="bold" />
          </a>
        </div>
      </div>

      {/* 2. Sub-Header: Categorized Tabs, Heuristic Search Bar, Scope Switcher, and Add Record */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 px-4 py-2.5 bg-elevated/25 border-b border-default">
        {/* Left: Category Navigation Pills */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-surface border border-subtle shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('websites');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'websites'
                ? 'bg-accent text-accent-fg shadow-2xs font-bold'
                : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
            }`}
          >
            <Globe size={14} weight="duotone" />
            <span>Websites & Subdomains</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeCategory === 'websites'
                  ? 'bg-accent-fg/20 text-accent-fg'
                  : 'bg-elevated text-fg-muted'
              }`}
            >
              {websiteRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('mail');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'mail'
                ? 'bg-accent text-accent-fg shadow-2xs font-bold'
                : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
            }`}
          >
            <EnvelopeSimple size={14} weight="duotone" />
            <span>Mail & Email Routing</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeCategory === 'mail'
                  ? 'bg-accent-fg/20 text-accent-fg'
                  : 'bg-elevated text-fg-muted'
              }`}
            >
              {mailRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-accent text-accent-fg shadow-2xs font-bold'
                : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
            }`}
          >
            <SquaresFour size={14} weight="duotone" />
            <span>All Records</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeCategory === 'all'
                  ? 'bg-accent-fg/20 text-accent-fg'
                  : 'bg-elevated text-fg-muted'
              }`}
            >
              {allFilteredRecords.length}
            </span>
          </button>
        </div>

        {/* Right: Heuristic Search & Scope Switcher & Add Record */}
        <div className="flex items-center gap-2 flex-1 xl:max-w-xl xl:justify-end flex-wrap sm:flex-nowrap">
          {/* Heuristic Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass
              size={14}
              weight="bold"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search (e.g. "rioanime", IP, host)...`}
              className="w-full rounded-lg border border-default bg-surface hover:bg-elevated/40 focus:border-focus focus:ring-1 focus:ring-accent-ring pl-8 pr-7 py-1.5 text-xs text-fg-primary placeholder:text-fg-muted transition-colors outline-hidden shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary cursor-pointer p-0.5"
                title="Clear search"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>

          {/* Scope Selector: Active Domain vs All Domains */}
          <div
            className="flex items-center p-0.5 rounded-lg bg-surface border border-subtle shrink-0"
            title="Switch search scope between current domain or all domains"
          >
            <button
              type="button"
              onClick={() => {
                setSearchScope('current');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                searchScope === 'current'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
              }`}
            >
              <span>{domain.name}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchScope('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                searchScope === 'all'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-fg-secondary hover:text-fg-primary hover:bg-elevated'
              }`}
            >
              <Globe size={11} weight="duotone" />
              <span>All Domains</span>
              {matchCountInOtherDomains > 0 && searchScope === 'current' && (
                <span className="rounded-full bg-accent px-1 text-[9px] font-bold text-accent-fg">
                  +{matchCountInOtherDomains}
                </span>
              )}
            </button>
          </div>

          {/* Add Record button */}
          <button
            type="button"
            onClick={() =>
              onOpenCreateRecord(
                undefined,
                activeCategory === 'mail' ? 'MX' : 'A'
              )
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Add Record</span>
          </button>
        </div>
      </div>

      {/* 3. Categorized Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-default bg-elevated/50 text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              <th className="px-4 py-2.5">
                {activeCategory === 'mail' ? 'Mail Host / Address' : 'Subdomain / Hostname'}
              </th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">
                {activeCategory === 'mail' ? 'Destination Server / Policy' : 'Target Host / IP Address'}
              </th>
              <th className="px-4 py-2.5">Cloudflare Proxy</th>
              <th className="px-4 py-2.5">TTL</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-fg-muted">
                  Loading records from Cloudflare...
                </td>
              </tr>
            ) : paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <RecordRow
                  key={record.id || `${record.domainName}-${record.name}-${record.type}`}
                  record={record}
                  showDomainBadge={searchScope === 'all'}
                  onEdit={onEditRecord}
                  onDelete={onDeleteRecord}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-fg-muted">
                  {searchQuery ? (
                    <div className="flex flex-col items-center justify-center space-y-2.5 max-w-md mx-auto">
                      <p className="text-xs">
                        No records matching <strong className="text-fg-primary">"{searchQuery}"</strong> in{' '}
                        {searchScope === 'current' ? domain.name : 'all domains'}.
                      </p>
                      {searchScope === 'current' && matchCountInOtherDomains > 0 && (
                        <button
                          type="button"
                          onClick={() => setSearchScope('all')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        >
                          <Globe size={14} weight="duotone" />
                          <span>
                            Found {matchCountInOtherDomains} result(s) in other domains! Click to Search All Domains
                          </span>
                        </button>
                      )}
                    </div>
                  ) : activeCategory === 'websites' ? (
                    'No website subdomains configured yet. Click "Add Record" to create one.'
                  ) : activeCategory === 'mail' ? (
                    'No mail routing records configured for this domain.'
                  ) : (
                    'No records found.'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Bar */}
      {allFilteredRecords.length > PAGE_SIZE && (
        <div className="border-t border-default">
          <PaginationBar
            currentPage={safePage}
            totalItems={allFilteredRecords.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="records"
          />
        </div>
      )}

      {/* 5. Summary Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-default bg-elevated/25 text-[11px] text-fg-muted">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-fg-secondary">
            <TreeStructure size={13} weight="duotone" className="text-blue-400" />
            <span>
              {subdomainsCount} custom website subdomains {searchScope === 'all' ? '(across all domains)' : ''}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-fg-secondary">
            <CloudCheck size={13} weight="fill" className="text-amber-400" />
            <span>{proxiedCount} CDN proxied (SSL & DDoS protected)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-fg-secondary">
            <HardDrives size={13} weight="duotone" className="text-purple-400" />
            <span>
              {targetPool.length} {searchScope === 'all' ? 'total records across all domains' : `Cloudflare records in ${domain.name}`}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-fg-muted">
          <ShieldCheck size={13} weight="duotone" className="text-amber-400" />
          <span>
            {searchScope === 'all'
              ? `Cloudflare Edge Active for ${allDomains.length} domains`
              : `Cloudflare Edge Active for ${domain.name}`}
          </span>
        </div>
      </div>
    </div>
  );
};
