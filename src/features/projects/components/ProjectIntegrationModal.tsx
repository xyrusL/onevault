import React, { useState, useEffect } from 'react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import {
  Code,
  Check,
  Copy,
  Key,
  ShieldCheck,
  CircleNotch,
  Globe,
  Terminal,
} from '@phosphor-icons/react';
import { apiRequest } from '../../../shared/services/api-client.service';
import type { ProjectItem } from '../types/projects.types';

export interface ProjectIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  onProjectUpdated?: (updated: ProjectItem) => void;
}

type EnvFormat = 'universal' | 'vite' | 'nextjs' | 'all';
type DomainChoice = 'dezely' | 'ainxe' | 'local';

export const ProjectIntegrationModal: React.FC<ProjectIntegrationModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Production domain selection (defaults to onevault.dezely.com)
  const [selectedDomain, setSelectedDomain] = useState<DomainChoice>('dezely');
  // Environment format selection (defaults to standard universal keys)
  const [selectedFormat, setSelectedFormat] = useState<EnvFormat>('universal');

  useEffect(() => {
    if (project) {
      setIsConnected(project.status === 'active');
    }
  }, [project]);

  // Auto-poll connection state if project is in 'connecting' mode
  useEffect(() => {
    if (!isOpen || !project || isConnected) return;

    const interval = setInterval(async () => {
      try {
        setIsVerifying(true);
        const res = await apiRequest<{
          id: string;
          status: string;
          verified: boolean;
        }>(`/projects/${project.id}/verify`, { auth: true });

        if (res && res.verified) {
          setIsConnected(true);
          if (onProjectUpdated) {
            onProjectUpdated({ ...project, status: 'active' });
          }
        }
      } catch {
        // Continue polling
      } finally {
        setIsVerifying(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, project, isConnected, onProjectUpdated]);

  if (!project) return null;

  const baseDomainUrl =
    selectedDomain === 'dezely'
      ? 'https://onevault.dezely.com'
      : selectedDomain === 'ainxe'
      ? 'https://onevault.ainxe.com'
      : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173';

  const gatewayUrl = `${baseDomainUrl}/api/gateway/${project.slug}`;

  // Generate dynamic snippet based on standard/framework format
  const getSnippet = (): string => {
    switch (selectedFormat) {
      case 'universal':
        return `# OneVault Universal Edge Shield for ${project.name}
# Standard environment variables (Node.js, Docker, backend, generic)
ONEVAULT_GATEWAY_URL=${gatewayUrl}
ONEVAULT_GATEWAY_TOKEN=${project.gatewayToken}
ONEVAULT_MODE=vault`;

      case 'vite':
        return `# OneVault Edge Shield for ${project.name} (Vite / React / Vue)
VITE_ONEVAULT_GATEWAY_URL=${gatewayUrl}
VITE_ONEVAULT_GATEWAY_TOKEN=${project.gatewayToken}
VITE_ONEVAULT_MODE=vault`;

      case 'nextjs':
        return `# OneVault Edge Shield for ${project.name} (Next.js App & Pages Router)
NEXT_PUBLIC_ONEVAULT_GATEWAY_URL=${gatewayUrl}
NEXT_PUBLIC_ONEVAULT_GATEWAY_TOKEN=${project.gatewayToken}
NEXT_PUBLIC_ONEVAULT_MODE=vault`;

      case 'all':
        return `# OneVault Universal Edge Shield for ${project.name}
# Standard Universal
ONEVAULT_GATEWAY_URL=${gatewayUrl}
ONEVAULT_GATEWAY_TOKEN=${project.gatewayToken}
ONEVAULT_MODE=vault

# Vite Framework Alias
VITE_ONEVAULT_GATEWAY_URL=${gatewayUrl}
VITE_ONEVAULT_GATEWAY_TOKEN=${project.gatewayToken}
VITE_ONEVAULT_MODE=vault

# Next.js Framework Alias
NEXT_PUBLIC_ONEVAULT_GATEWAY_URL=${gatewayUrl}
NEXT_PUBLIC_ONEVAULT_GATEWAY_TOKEN=${project.gatewayToken}
NEXT_PUBLIC_ONEVAULT_MODE=vault`;
    }
  };

  const envSnippet = getSnippet();

  const handleCopySnippet = () => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(envSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const handleCopyToken = () => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(project.gatewayToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${project.name} • Connection & Token`}
      subtitle="Paste this gateway configuration into your site to auto-verify and shield your project."
      icon={<Code size={18} className="text-emerald-400" />}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Live Pairing Status Indicator */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
            isConnected
              ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/12 border-amber-500/35 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <div>
              <p className="font-bold text-xs text-fg-primary">
                {isConnected
                  ? 'Handshake Verified: Project is Connected & Protected'
                  : 'Waiting for Handshake: Project Token Generated'}
              </p>
              <p className="text-[11px] text-fg-muted">
                {isConnected
                  ? 'OneVault is actively monitoring traffic, concealing APIs, and defending this site.'
                  : 'Add the configuration below to your site’s .env and start your site. OneVault will auto-detect it.'}
              </p>
            </div>
          </div>

          {!isConnected && isVerifying && (
            <CircleNotch size={14} className="animate-spin text-amber-400 shrink-0" />
          )}
        </div>

        {/* Project Gateway Token Bar */}
        <div className="p-3 rounded-xl bg-surface border border-default space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-fg-secondary flex items-center gap-1.5">
              <Key size={13} className="text-sky-400" />
              <span>Project Gateway Token (Secret)</span>
            </span>
            <button
              type="button"
              onClick={handleCopyToken}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              {copiedToken ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Token</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2 rounded-lg bg-canvas border border-default/70 font-mono text-[11px] text-fg-primary truncate select-all">
            {project.gatewayToken}
          </div>
        </div>

        {/* Configuration Controls: Production Domain & Framework Type */}
        <div className="space-y-2.5">
          {/* Production Domain Selector */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-fg-secondary flex items-center gap-1">
              <Globe size={13} className="text-emerald-400" />
              <span>OneVault Production Gateway:</span>
            </span>
            <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-default">
              <button
                type="button"
                onClick={() => setSelectedDomain('dezely')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                  selectedDomain === 'dezely'
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                onevault.dezely.com
              </button>
              <button
                type="button"
                onClick={() => setSelectedDomain('ainxe')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                  selectedDomain === 'ainxe'
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                onevault.ainxe.com
              </button>
              <button
                type="button"
                onClick={() => setSelectedDomain('local')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                  selectedDomain === 'local'
                    ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                Localhost
              </button>
            </div>
          </div>

          {/* Framework Format Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-default">
              <button
                type="button"
                onClick={() => setSelectedFormat('universal')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedFormat === 'universal'
                    ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                <Terminal size={11} />
                <span>Universal (Standard)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('vite')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                  selectedFormat === 'vite'
                    ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                Vite
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('nextjs')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                  selectedFormat === 'nextjs'
                    ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                Next.js
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('all')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                  selectedFormat === 'all'
                    ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-fg-muted hover:text-fg-primary'
                }`}
              >
                All-in-One
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopySnippet}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-elevated border border-default text-[11px] font-semibold text-fg-primary cursor-pointer transition-colors"
            >
              {copiedSnippet ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy .env Snippet</span>
                </>
              )}
            </button>
          </div>

          {/* Snippet Block */}
          <pre className="p-3 rounded-xl bg-black/60 border border-default text-[11px] font-mono text-zinc-300 overflow-x-auto select-all leading-relaxed">
            {envSnippet}
          </pre>
        </div>

        {/* Benefits list */}
        <div className="p-3 rounded-xl bg-surface/50 border border-default text-[11px] text-fg-muted space-y-1">
          <p className="font-bold text-fg-primary flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Automatic Plug-In Activation</span>
          </p>
          <p className="leading-relaxed">
            Standard <code className="text-fg-secondary">ONEVAULT_*</code> variables work with Node.js, Docker, Vite, Next.js, and edge workers. Once saved in your project's <code className="text-fg-secondary">.env</code>, your site sends an authenticated handshake token on boot.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent-hover text-accent-fg cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
