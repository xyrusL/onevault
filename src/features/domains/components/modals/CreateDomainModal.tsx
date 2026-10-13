import React, { useState } from 'react';
import { CircleNotch, Globe, Info } from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';

interface CreateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (domainName: string) => Promise<void>;
}

export const CreateDomainModal: React.FC<CreateDomainModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [domainName, setDomainName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domainName.trim().toLowerCase();
    if (!cleaned) {
      setError('Please enter a domain name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(cleaned);
      setDomainName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register domain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setDomainName('');
      setError(null);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Add New Website Domain"
      subtitle="Register an apex domain to manage web services and subdomains"
      icon={<Globe size={18} weight="duotone" className="text-accent" />}
      maxWidthClass="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="rounded-lg border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !domainName.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSubmitting && <CircleNotch size={13} weight="bold" className="animate-spin" />}
            <span>{isSubmitting ? 'Adding...' : 'Add Domain'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label
            htmlFor="domain-name-input"
            className="block text-xs font-medium text-fg-secondary mb-1.5"
          >
            Domain Name
          </label>
          <div className="relative">
            <input
              id="domain-name-input"
              type="text"
              value={domainName}
              onChange={(e) => {
                setDomainName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="example.com or myapp.io"
              autoFocus
              className="w-full rounded-lg border border-default bg-input hover:bg-input-hover focus:border-focus focus:ring-1 focus:ring-accent-ring px-3 py-2 text-xs font-mono text-fg-primary transition-colors outline-hidden"
            />
          </div>
          <p className="mt-1 text-[11px] text-fg-muted">
            Enter the apex root domain without <code className="text-accent">http://</code> or <code className="text-accent">https://</code>.
          </p>
        </div>

        {/* Helpful Info Box */}
        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-fg-secondary">
          <Info size={16} weight="fill" className="text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-fg-primary block">
              Cloudflare DNS Integration
            </span>
            <p className="text-[11px] leading-relaxed text-fg-muted">
              Once added, Cloudflare will assign two authoritative nameservers (e.g. <span className="font-mono text-fg-secondary">felicity.ns.cloudflare.com</span>). Starter A and CNAME records will be created automatically.
            </p>
          </div>
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
