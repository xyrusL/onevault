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
import type { DomainRecordItem } from '../../types/domains.types';
import { getTxtCategoryBadge, TYPE_COLORS } from './RecordRow';

interface MobileRecordCardProps {
  record: DomainRecordItem;
  showDomainBadge?: boolean;
  onEdit: (record: DomainRecordItem) => void;
  onDelete: (record: DomainRecordItem) => void;
}

export const MobileRecordCard: React.FC<MobileRecordCardProps> = ({
  record,
  showDomainBadge = false,
  onEdit,
  onDelete,
}) => {
  const [copiedValue, setCopiedValue] = useState(false);

  const cleanContent = record.content.replace(/^"|"$/g, '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanContent);
    setCopiedValue(true);
    setTimeout(() => setCopiedValue(false), 2000);
  };

  const isProxyEligible = ['A', 'AAAA', 'CNAME'].includes(record.type);
  const isApex = record.subdomain === '@' || record.name === record.domainName;
  const txtBadge =
    record.type === 'TXT' ? getTxtCategoryBadge(record.name, record.content) : null;

  return (
    <div className="flex flex-col gap-2 p-3 hover:bg-elevated/35 transition-colors">
      {/* Row 1: Type + Hostname + Compact Badges on Left | Status Icons & Actions on Right */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border shrink-0 ${
              TYPE_COLORS[record.type] || 'bg-elevated text-fg-secondary border-default'
            }`}
          >
            {record.type}
          </span>

          <span className="font-mono text-xs font-semibold text-fg-primary truncate select-all">
            {record.name}
          </span>

          {showDomainBadge && (
            <span
              title={`Belongs to domain: ${record.domainName}`}
              className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold bg-accent/15 text-accent border border-accent/25 shrink-0"
            >
              {record.domainName}
            </span>
          )}

          {isApex && (
            <span
              title="Root Apex (@)"
              className="rounded px-1 py-0.2 text-[9px] font-mono font-bold bg-elevated text-fg-muted border border-subtle shrink-0"
            >
              @
            </span>
          )}

          {txtBadge && (
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border shrink-0 ${txtBadge.color}`}
            >
              {txtBadge.label}
            </span>
          )}
        </div>

        {/* Right: Proxy Icon + Edit + Delete/Lock Icon */}
        <div className="flex items-center gap-1 shrink-0">
          {isProxyEligible && (
            record.proxied ? (
              <span
                title="Proxied (Cloudflare CDN & DDoS Protection Active)"
                className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400"
              >
                <CloudCheck size={13} weight="fill" />
              </span>
            ) : (
              <span
                title="DNS Only"
                className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md bg-elevated border border-subtle text-fg-muted"
              >
                <CloudSlash size={13} weight="duotone" />
              </span>
            )
          )}

          <button
            type="button"
            onClick={() => onEdit(record)}
            title="Edit record"
            aria-label="Edit record"
            className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-subtle bg-elevated/70 text-fg-secondary hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <PencilSimple size={13} weight="bold" />
          </button>

          {record.locked ? (
            <span
              title="Locked by Cloudflare (System record)"
              className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400/90"
            >
              <Lock size={13} weight="fill" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onDelete(record)}
              title="Delete record"
              aria-label="Delete record"
              className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-subtle bg-elevated/70 text-fg-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <Trash size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Target / Destination Value Box with Copy Action */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-elevated/45 border border-subtle px-2.5 py-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {record.type === 'MX' ? (
            <>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-400 shrink-0">
                P:{record.priority ?? 10}
              </span>
              <span className="font-mono text-[11px] text-fg-secondary truncate select-all">
                {record.content}
              </span>
            </>
          ) : record.type === 'CNAME' ? (
            <>
              <span className="text-fg-muted text-[10px] shrink-0">➔</span>
              <span className="font-mono text-[11px] font-medium text-purple-400 truncate select-all">
                {record.content}
              </span>
            </>
          ) : (
            <span className="font-mono text-[11px] text-fg-secondary truncate select-all">
              {cleanContent}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {record.ttl !== 1 && (
            <span className="font-mono text-[10px] text-fg-muted">
              {record.ttl}s
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy target value"
            aria-label="Copy target value"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-fg-muted hover:text-fg-primary hover:bg-surface transition-colors cursor-pointer"
          >
            {copiedValue ? (
              <Check size={11} weight="bold" className="text-emerald-400" />
            ) : (
              <Copy size={11} weight="bold" />
            )}
          </button>
        </div>
      </div>

      {record.comment && (
        <p className="text-[11px] text-fg-muted truncate px-0.5">
          {record.comment}
        </p>
      )}
    </div>
  );
};
