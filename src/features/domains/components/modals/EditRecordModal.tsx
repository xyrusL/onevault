import React, { useEffect, useState } from 'react';
import {
  CircleNotch,
  CloudCheck,
  CloudSlash,
  Lock,
  PencilSimple,
} from '@phosphor-icons/react';
import { CustomSelect, SelectOption } from '../../../../shared/components/forms/CustomSelect';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import type { DnsRecordType, DomainRecordItem, UpdateRecordPayload } from '../../types/domains.types';

interface EditRecordModalProps {
  isOpen: boolean;
  record: DomainRecordItem | null;
  onClose: () => void;
  onSubmit: (recordId: string, payload: UpdateRecordPayload) => Promise<void>;
}

const TYPE_OPTIONS: SelectOption<DnsRecordType>[] = [
  { value: 'A', label: 'A', badge: 'IPv4' },
  { value: 'AAAA', label: 'AAAA', badge: 'IPv6' },
  { value: 'CAA', label: 'CAA', badge: 'CA Auth' },
  { value: 'CERT', label: 'CERT', badge: 'Certificate' },
  { value: 'CNAME', label: 'CNAME', badge: 'Alias' },
  { value: 'DNSKEY', label: 'DNSKEY', badge: 'DNSSEC' },
  { value: 'DS', label: 'DS', badge: 'Signer' },
  { value: 'HTTPS', label: 'HTTPS', badge: 'HTTPS SVC' },
  { value: 'LOC', label: 'LOC', badge: 'Location' },
  { value: 'MX', label: 'MX', badge: 'Mail' },
  { value: 'NAPTR', label: 'NAPTR', badge: 'Pointer' },
  { value: 'NS', label: 'NS', badge: 'Nameserver' },
  { value: 'OPENPGPKEY', label: 'OPENPGPKEY', badge: 'OpenPGP' },
  { value: 'PTR', label: 'PTR', badge: 'Reverse DNS' },
  { value: 'SMIMEA', label: 'SMIMEA', badge: 'S/MIME' },
  { value: 'SRV', label: 'SRV', badge: 'Service' },
  { value: 'SSHFP', label: 'SSHFP', badge: 'SSH Key' },
  { value: 'SVCB', label: 'SVCB', badge: 'Service' },
  { value: 'TLSA', label: 'TLSA', badge: 'TLS Cert' },
  { value: 'TXT', label: 'TXT', badge: 'SPF / DKIM' },
  { value: 'URI', label: 'URI', badge: 'URI' },
];

const TTL_OPTIONS: SelectOption<string>[] = [
  { value: '1', label: 'Auto (Recommended)', badge: 'Default' },
  { value: '60', label: '1 min' },
  { value: '120', label: '2 min' },
  { value: '300', label: '5 min' },
  { value: '600', label: '10 min' },
  { value: '900', label: '15 min' },
  { value: '1800', label: '30 min' },
  { value: '3600', label: '1 hr' },
  { value: '7200', label: '2 hr' },
  { value: '18000', label: '5 hr' },
  { value: '43200', label: '12 hr' },
  { value: '86400', label: '1 day' },
];

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  record,
  onClose,
  onSubmit,
}) => {
  const [subdomain, setSubdomain] = useState('');
  const [type, setType] = useState<DnsRecordType>('A');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('10');
  const [ttl, setTtl] = useState('1');
  const [proxied, setProxied] = useState(true);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setSubdomain(record.subdomain);
      setType(record.type);
      setContent(record.content);
      setPriority(record.priority !== undefined ? String(record.priority) : '10');
      setTtl(String(record.ttl));
      setProxied(record.proxied);
      setComment(record.comment || '');
      setError(null);
    }
  }, [record]);

  if (!record) return null;

  const isProxiable = ['A', 'AAAA', 'CNAME'].includes(type);
  const cleanSub = subdomain.trim();
  const previewHost =
    !cleanSub || cleanSub === '@'
      ? record.domainName
      : `${cleanSub}.${record.domainName}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Destination / Value cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(record.id, {
        subdomain: cleanSub || '@',
        type,
        content: content.trim(),
        priority: ['MX', 'SRV', 'URI'].includes(type) ? Number(priority) || 10 : undefined,
        ttl: Number(ttl) || 1,
        proxied: isProxiable ? proxied : false,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContentLabelAndInput = () => {
    switch (type) {
      case 'A':
        return (
          <div>
            <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
              IPv4 address (required)
            </label>
            <input
              id="edit-content-input"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="192.0.2.1"
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
        );
      case 'AAAA':
        return (
          <div>
            <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
              IPv6 address (required)
            </label>
            <input
              id="edit-content-input"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="2001:db8::1"
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
        );
      case 'CNAME':
        return (
          <div>
            <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
              Target (required)
            </label>
            <input
              id="edit-content-input"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="example.pages.dev or cname.vercel-dns.com"
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
        );
      case 'MX':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
                Mail server (required)
              </label>
              <input
                id="edit-content-input"
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="route1.mx.cloudflare.net"
                className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
              />
            </div>
            <div>
              <label htmlFor="edit-priority-input" className="block text-xs font-medium text-fg-secondary mb-1">
                Priority
              </label>
              <input
                id="edit-priority-input"
                type="number"
                min="0"
                max="65535"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
              />
            </div>
          </div>
        );
      case 'TXT':
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-content-input" className="text-xs font-medium text-fg-secondary">
                Content (required)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setContent('v=spf1 include:_spf.mx.cloudflare.net ~all')}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-elevated border border-subtle text-accent hover:border-accent cursor-pointer"
                >
                  + SPF
                </button>
                <button
                  type="button"
                  onClick={() => setContent('v=DMARC1; p=none; sp=none')}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-elevated border border-subtle text-purple-400 hover:border-purple-400 cursor-pointer"
                >
                  + DMARC
                </button>
              </div>
            </div>
            <textarea
              id="edit-content-input"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="v=spf1 include:_spf.mx.cloudflare.net ~all"
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden resize-none"
            />
          </div>
        );
      case 'NS':
        return (
          <div>
            <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
              Nameserver (required)
            </label>
            <input
              id="edit-content-input"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ns1.example.com"
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
        );
      case 'SRV':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
                Target (required)
              </label>
              <input
                id="edit-content-input"
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="sip.example.com"
                className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
              />
            </div>
            <div>
              <label htmlFor="edit-priority-input" className="block text-xs font-medium text-fg-secondary mb-1">
                Priority
              </label>
              <input
                id="edit-priority-input"
                type="number"
                min="0"
                max="65535"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
              />
            </div>
          </div>
        );
      case 'CAA':
        return (
          <div>
            <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
              CAA Value (required)
            </label>
            <input
              id="edit-content-input"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='0 issue "letsencrypt.org"'
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
        );
      default:
        return (
          <div>
            <label htmlFor="edit-content-input" className="block text-xs font-medium text-fg-secondary mb-1">
              Content / Target (required)
            </label>
            <input
              id="edit-content-input"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter ${type} record value`}
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
        );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Record"
      subtitle={`Modify DNS settings for ${record.name}`}
      icon={<PencilSimple size={18} weight="bold" className="text-accent" />}
      maxWidthClass="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSubmitting && <CircleNotch size={13} weight="bold" className="animate-spin" />}
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Cloudflare Locked Warning */}
        {record.locked && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <Lock size={15} weight="fill" className="text-amber-400 shrink-0" />
            <span>
              <strong>Cloudflare System Record:</strong> Generated automatically by Cloudflare. Changing values may affect Email Routing or SSL security.
            </span>
          </div>
        )}

        {/* Dynamic Cloudflare Summary Banner */}
        <div className="rounded-lg border border-subtle bg-elevated/40 px-3 py-2 text-xs text-fg-secondary">
          <span className="font-mono text-fg-primary font-bold">{cleanSub || '@'}</span>
          {type === 'A' && (
            <span>
              {' '}points to IPv4{' '}
              <span className="font-mono text-accent font-semibold">{content.trim() || '[IPv4 address]'}</span>
            </span>
          )}
          {type === 'AAAA' && (
            <span>
              {' '}points to IPv6{' '}
              <span className="font-mono text-cyan-400 font-semibold">{content.trim() || '[IPv6 address]'}</span>
            </span>
          )}
          {type === 'CNAME' && (
            <span>
              {' '}is an alias of{' '}
              <span className="font-mono text-purple-400 font-semibold">{content.trim() || '[target domain]'}</span>
            </span>
          )}
          {type === 'MX' && (
            <span>
              {' '}points to mail server{' '}
              <span className="font-mono text-emerald-400 font-semibold">{content.trim() || '[mail server]'}</span>
              {' '}with priority{' '}
              <span className="font-mono text-emerald-400 font-bold">{priority || '10'}</span>
            </span>
          )}
          {type === 'TXT' && <span> contains text record content</span>}
          {type === 'NS' && (
            <span>
              {' '}delegates to nameserver{' '}
              <span className="font-mono text-indigo-400 font-semibold">{content.trim() || '[nameserver]'}</span>
            </span>
          )}
          {type === 'CAA' && <span> Certification Authority Authorization</span>}
          {type === 'SRV' && (
            <span>
              {' '}points to service{' '}
              <span className="font-mono text-rose-400 font-semibold">{content.trim() || '[target]'}</span>
            </span>
          )}
          {!['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'CAA', 'SRV'].includes(type) && (
            <span>
              {' '}configured with <strong className="text-accent">{type}</strong> record
            </span>
          )}
        </div>

        {/* Row 1: Type Selector & Name */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-fg-secondary mb-1">
              Type
            </label>
            <CustomSelect<DnsRecordType>
              value={type}
              options={TYPE_OPTIONS}
              maxHeightClass="max-h-60"
              onChange={(val) => {
                setType(val);
                if (!['A', 'AAAA', 'CNAME'].includes(val)) {
                  setProxied(false);
                }
              }}
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="edit-name-input"
              className="block text-xs font-medium text-fg-secondary mb-1"
            >
              Name (use @ for root)
            </label>
            <div className="flex items-center gap-1">
              <input
                id="edit-name-input"
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="e.g. @ or app, mail, api"
                className="flex-1 rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
              />
              <span className="font-mono text-xs text-fg-muted shrink-0 px-1 hidden sm:inline">
                .{record.domainName}
              </span>
            </div>
          </div>
        </div>

        {/* Host resolution preview */}
        <div className="flex items-center justify-between text-[11px] text-fg-muted font-mono px-0.5">
          <span>Resolves to:</span>
          <span className="text-fg-primary font-bold">{previewHost}</span>
        </div>

        {/* Row 2: Type-specific content input */}
        {renderContentLabelAndInput()}

        {/* Cloudflare Proxy Toggle (Only for A / AAAA / CNAME) */}
        {isProxiable && (
          <div className="rounded-lg border border-subtle bg-elevated/40 p-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                {proxied ? (
                  <CloudCheck size={16} weight="fill" className="text-amber-400 shrink-0" />
                ) : (
                  <CloudSlash size={16} weight="duotone" className="text-fg-muted shrink-0" />
                )}
                <span className="text-xs font-semibold text-fg-primary">
                  Proxy status: {proxied ? 'Proxied' : 'DNS Only'}
                </span>
              </div>
              <p className="text-[11px] text-fg-muted">
                {proxied
                  ? 'Cloudflare proxy protects origin IP, handles SSL, and accelerates traffic.'
                  : 'Direct DNS resolution to target address without Cloudflare CDN.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setProxied((prev) => !prev)}
              aria-label="Toggle proxy status"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                proxied ? 'bg-amber-500' : 'bg-subtle'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  proxied ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* TTL Selector */}
        <div>
          <label className="block text-xs font-medium text-fg-secondary mb-1">
            TTL
          </label>
          <CustomSelect<string>
            value={ttl}
            options={TTL_OPTIONS}
            maxHeightClass="max-h-48"
            onChange={setTtl}
          />
        </div>

        {/* Comment field */}
        <div>
          <label
            htmlFor="edit-comment-input"
            className="block text-xs font-medium text-fg-secondary mb-1"
          >
            Comment (optional)
          </label>
          <input
            id="edit-comment-input"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Production web application or verification tag"
            className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-1.5 text-xs text-fg-primary transition-colors outline-hidden"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 p-2.5 text-xs text-danger font-medium">
            {error}
          </div>
        )}
      </form>
    </BaseModal>
  );
};
