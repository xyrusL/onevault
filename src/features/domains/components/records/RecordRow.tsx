import React, { useState } from 'react';
import {
  Check,
  CloudCheck,
  CloudSlash,
  Copy,
  Lock,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import type { DnsRecordType, DomainRecordItem } from '../../types/domains.types';

interface RecordRowProps {
  record: DomainRecordItem;
  showDomainBadge?: boolean;
  onEdit: (record: DomainRecordItem) => void;
  onDelete: (record: DomainRecordItem) => void;
}

const TYPE_COLORS: Partial<Record<DnsRecordType, string>> = {
  A: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  AAAA: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  CNAME: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  TXT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MX: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  NS: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  SRV: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CAA: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  HTTPS: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  PTR: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  DNSKEY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  DS: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CERT: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  URI: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
};

function getTxtCategoryBadge(name: string, content: string) {
  const lowerName = name.toLowerCase();
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('v=spf1')) {
    return { label: 'SPF', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }
  if (lowerName.includes('_dmarc')) {
    return { label: 'DMARC', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  }
  if (lowerName.includes('domainkey') || lowerContent.includes('v=dkim1')) {
    return { label: 'DKIM', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  }
  if (lowerContent.includes('verify') || lowerContent.includes('verification') || lowerName.includes('verify')) {
    return { label: 'VERIFY', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
  }
  return null;
}

export const RecordRow: React.FC<RecordRowProps> = ({
  record,
  showDomainBadge = false,
  onEdit,
  onDelete,
}) => {
  const [copiedValue, setCopiedValue] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(true);
    setTimeout(() => setCopiedValue(false), 2000);
  };

  const isProxyEligible = ['A', 'AAAA', 'CNAME'].includes(record.type);
  const isApex = record.subdomain === '@' || record.name === record.domainName;
  const txtBadge = record.type === 'TXT' ? getTxtCategoryBadge(record.name, record.content) : null;

  return (
    <tr className="group border-b border-subtle hover:bg-elevated/40 transition-colors">
      {/* 1. Host / Subdomain */}
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-semibold text-fg-primary truncate select-all">
                {record.name}
              </span>

              {showDomainBadge && (
                <span
                  title={`Belongs to domain: ${record.domainName}`}
                  className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold bg-accent/15 text-accent border border-accent/25"
                >
                  {record.domainName}
                </span>
              )}

              {isApex ? (
                <span className="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-elevated text-fg-muted border border-subtle">
                  Root Apex
                </span>
              ) : (
                <span className="rounded px-1.5 py-0.2 text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {record.subdomain}
                </span>
              )}

              {txtBadge && (
                <span
                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border ${txtBadge.color}`}
                >
                  {txtBadge.label}
                </span>
              )}

              {record.locked && (
                <span
                  title="Generated & managed automatically by Cloudflare (Locked to prevent service disruption)"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20"
                >
                  <Lock size={10} weight="fill" />
                  <span>Cloudflare Locked</span>
                </span>
              )}
            </div>

            {record.comment && (
              <p className="mt-0.5 text-[11px] text-fg-muted truncate max-w-xs">
                {record.comment}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* 2. Type Badge */}
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold border ${
            TYPE_COLORS[record.type] || 'bg-elevated text-fg-secondary border-default'
          }`}
        >
          {record.type}
        </span>
      </td>

      {/* 3. Formatted Value / Destination Column */}
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2 max-w-md">
          {/* Custom Tailored Formatting based on Record Type */}
          {record.type === 'MX' ? (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-400 shrink-0">
                Priority {record.priority ?? 10}
              </span>
              <span className="font-mono text-xs text-fg-secondary truncate select-all">
                {record.content}
              </span>
            </div>
          ) : record.type === 'CNAME' ? (
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-fg-muted text-[11px]">➔</span>
              <span className="font-mono text-xs font-semibold text-purple-400 truncate select-all">
                {record.content}
              </span>
            </div>
          ) : record.type === 'NS' ? (
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 font-mono text-[10px] text-indigo-400 shrink-0">
                NS
              </span>
              <span className="font-mono text-xs text-fg-secondary truncate select-all">
                {record.content}
              </span>
            </div>
          ) : record.type === 'SRV' ? (
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 font-mono text-[10px] text-rose-400 shrink-0">
                SRV
              </span>
              <span className="font-mono text-xs text-fg-secondary truncate select-all">
                {record.content}
              </span>
            </div>
          ) : (
            <span className="font-mono text-xs text-fg-secondary truncate select-all">
              {record.content.replace(/^"|"$/g, '')}
            </span>
          )}

          <button
            type="button"
            onClick={() => handleCopy(record.content.replace(/^"|"$/g, ''))}
            title="Copy value"
            className="rounded p-1 text-fg-muted hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer shrink-0"
          >
            {copiedValue ? (
              <Check size={12} weight="bold" className="text-emerald-400" />
            ) : (
              <Copy size={12} weight="bold" />
            )}
          </button>
        </div>
      </td>

      {/* 4. Proxy Status */}
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        {isProxyEligible ? (
          record.proxied ? (
            <span
              title="Cloudflare CDN & DDoS Protection Active"
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20"
            >
              <CloudCheck size={13} weight="fill" className="text-amber-400 shrink-0" />
              <span>Proxied</span>
            </span>
          ) : (
            <span
              title="Direct DNS Resolution Only"
              className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium text-fg-muted border border-subtle"
            >
              <CloudSlash size={13} weight="duotone" className="shrink-0" />
              <span>DNS Only</span>
            </span>
          )
        ) : (
          <span className="text-[11px] text-fg-muted font-mono">DNS Only</span>
        )}
      </td>

      {/* 5. TTL */}
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        <span className="font-mono text-xs text-fg-muted">
          {record.ttl === 1 ? 'Auto' : `${record.ttl}s`}
        </span>
      </td>

      {/* 6. Actions */}
      <td className="px-4 py-3 align-middle whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(record)}
            title="Edit record"
            className="rounded-md p-1.5 text-fg-muted hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
          {record.locked ? (
            <button
              type="button"
              disabled
              title="Locked: Generated automatically by Cloudflare. Deletion is blocked to prevent breaking email, SSL, or routing services."
              className="rounded-md p-1.5 text-amber-400/80 bg-amber-500/10 border border-amber-500/20 cursor-not-allowed opacity-80"
            >
              <Lock size={14} weight="fill" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDelete(record)}
              title="Delete record"
              className="rounded-md p-1.5 text-fg-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <Trash size={14} weight="bold" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
