import React, { useState, useEffect } from 'react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import {
  ShieldCheck,
  Globe,
  Lock,
  Plus,
  Trash,
  CircleNotch,
  CheckCircle,
  Code,
} from '@phosphor-icons/react';
import { projectsService } from '../services/projects.service';
import type {
  ProjectItem,
  CreateProjectPayload,
  UpdateProjectPayload,
  ConcealedEndpoint,
} from '../types/projects.types';

export interface ProjectConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
  editingProject: ProjectItem | null;
}

export const ProjectConfigModal: React.FC<ProjectConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
}) => {
  const [inspectUrl, setInspectUrl] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectSuccess, setInspectSuccess] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [upstreamApi, setUpstreamApi] = useState('');
  const [concealedEndpoints, setConcealedEndpoints] = useState<ConcealedEndpoint[]>([]);

  // Shield Policies
  const [devMode, setDevMode] = useState(true);
  const [antiBot, setAntiBot] = useState(true);
  const [streamTokenSigning, setStreamTokenSigning] = useState(true);
  const [originLock, setOriginLock] = useState(false);
  const [rateLimitPerMin, setRateLimitPerMin] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setSlug(editingProject.slug);
      setDescription(editingProject.description);
      setSiteUrl(editingProject.siteUrl || '');
      setUpstreamApi(editingProject.upstreamApi || '');
      setConcealedEndpoints(editingProject.shieldPolicy.concealedEndpoints || []);
      setDevMode(editingProject.shieldPolicy.devMode !== false);
      setAntiBot(editingProject.shieldPolicy.antiBot);
      setStreamTokenSigning(editingProject.shieldPolicy.streamTokenSigning);
      setOriginLock(editingProject.shieldPolicy.originLock);
      setRateLimitPerMin(editingProject.shieldPolicy.rateLimitPerMin);
      setInspectUrl(editingProject.siteUrl || '');
    } else {
      // Completely clean/empty state for new projects
      setName('');
      setSlug('');
      setDescription('');
      setSiteUrl('');
      setUpstreamApi('');
      setConcealedEndpoints([]);
      setDevMode(true); // Default ON for easy local development
      setAntiBot(true);
      setStreamTokenSigning(true);
      setOriginLock(false);
      setRateLimitPerMin(60);
      setInspectUrl('');
    }
    setInspectSuccess(false);
  }, [editingProject, isOpen]);

  const handleAutoInspect = async () => {
    if (!inspectUrl.trim()) return;
    setIsInspecting(true);
    setInspectSuccess(false);
    try {
      const res = await projectsService.inspectSite(inspectUrl);
      if (res.ok) {
        if (!name || name === '') setName(res.name);
        if (!slug || slug === '') setSlug(res.slug);
        if (!description || description === '') setDescription(res.description);
        setSiteUrl(res.siteUrl);
        setInspectSuccess(true);
        setTimeout(() => setInspectSuccess(false), 3000);
      }
    } finally {
      setIsInspecting(false);
    }
  };

  const handleAddEndpoint = () => {
    setConcealedEndpoints((prev) => [
      ...prev,
      {
        id: `ep_${Date.now()}`,
        name: 'Concealed Mirror API',
        targetUrl: '',
        proxyPathPrefix: '/proxy',
        isSecret: true,
      },
    ]);
  };

  const handleRemoveEndpoint = (id: string) => {
    setConcealedEndpoints((prev) => prev.filter((ep) => ep.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        siteUrl: siteUrl.trim(),
        upstreamApi: upstreamApi.trim(),
        domains: [], // Cryptographic token provides authentication; no domain list needed
        shieldPolicy: {
          devMode,
          antiBot,
          streamTokenSigning,
          originLock,
          rateLimitPerMin: Number(rateLimitPerMin) || 60,
          tokenExpiryMinutes: 15,
          stealth404: true,
          concealedEndpoints,
        },
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProject ? `Configure ${editingProject.name}` : 'Connect New Project'}
      subtitle="Universal project gateway token, concealed upstream API reverse-proxy, and edge telemetry."
      icon={<ShieldCheck size={18} className="text-emerald-400" />}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Optional Auto-Detect URL Bar */}
        {!editingProject && (
          <div className="p-3 rounded-xl bg-surface border border-default/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                <Globe size={14} className="text-sky-400" />
                <span>Auto-Detect from Website URL (Optional)</span>
              </span>
              {inspectSuccess && (
                <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                  <CheckCircle size={13} weight="bold" />
                  <span>Metadata Detected!</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. http://localhost:5173 or https://mysite.com"
                value={inspectUrl}
                onChange={(e) => setInspectUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-canvas border border-default text-fg-primary focus:border-sky-500 focus:outline-none placeholder:text-fg-placeholder"
              />
              <button
                type="button"
                onClick={handleAutoInspect}
                disabled={isInspecting || !inspectUrl.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-elevated hover:bg-surface-solid border border-default text-fg-primary hover:text-sky-400 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isInspecting ? (
                  <CircleNotch size={13} className="animate-spin text-sky-400" />
                ) : null}
                <span>Auto-Fill Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Name & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Next.js Web App"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingProject) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                }
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-default text-fg-primary focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Project Slug / ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. my-app"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-default text-fg-primary focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="High-speed web platform with concealed APIs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-default text-fg-primary focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Dedicated Section: Concealed Upstream APIs & Streaming Shield */}
        <div className="p-3.5 rounded-xl bg-surface/50 border border-sky-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-sky-500/15 text-sky-400">
                <Lock size={14} weight="bold" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-fg-primary">
                  Concealed Upstream APIs & Streaming Shield
                </h4>
                <p className="text-[11px] text-fg-muted">
                  Upstream APIs and video sources are never exposed in browser DevTools or Network tabs.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddEndpoint}
              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
            >
              <Plus size={12} weight="bold" />
              <span>Add Endpoint</span>
            </button>
          </div>

          {/* Primary Upstream API */}
          <div>
            <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
              Primary Upstream Target API (Concealed by OneVault)
            </label>
            <input
              type="url"
              placeholder="e.g. https://api.myprovider.com"
              value={upstreamApi}
              onChange={(e) => setUpstreamApi(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-canvas border border-default text-fg-primary focus:border-sky-500 focus:outline-none font-mono"
            />
            <p className="text-[10px] text-fg-muted mt-0.5">
              OneVault reverse-proxies requests at <code className="text-sky-400">/api/gateway/{slug || 'project'}/proxy/*</code> so visitors never see this upstream source.
            </p>
          </div>

          {/* Additional Concealed Endpoints */}
          {concealedEndpoints.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-default/60">
              <span className="text-[11px] font-semibold text-fg-muted">
                Additional Concealed Endpoints / Mirrors
              </span>
              {concealedEndpoints.map((ep, idx) => (
                <div
                  key={ep.id || idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-default"
                >
                  <input
                    type="text"
                    placeholder="Endpoint Name (e.g. Streaming Host)"
                    value={ep.name}
                    onChange={(e) => {
                      const updated = [...concealedEndpoints];
                      updated[idx].name = e.target.value;
                      setConcealedEndpoints(updated);
                    }}
                    className="w-1/3 px-2 py-1 text-xs rounded bg-canvas border border-default text-fg-primary focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="https://provider.stream/..."
                    value={ep.targetUrl}
                    onChange={(e) => {
                      const updated = [...concealedEndpoints];
                      updated[idx].targetUrl = e.target.value;
                      setConcealedEndpoints(updated);
                    }}
                    className="flex-1 px-2 py-1 text-xs rounded bg-canvas border border-default text-fg-primary font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEndpoint(ep.id)}
                    className="p-1 text-fg-muted hover:text-rose-400 cursor-pointer"
                  >
                    <Trash size={13} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Development Mode Toggle (Security relaxed during local dev) */}
        <div className="p-3 rounded-xl bg-surface border border-sky-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400">
              <Code size={15} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-bold text-fg-primary">
                Development Mode (Relaxed Security)
              </p>
              <p className="text-[11px] text-fg-muted">
                Relaxes aggressive rate-limits and bot blocks during localhost development. Turn off for strict production enforcement.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={devMode}
              onChange={(e) => setDevMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* OneVault Shield Policies */}
        <div className="space-y-2 pt-2 border-t border-default">
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
            OneVault Edge Shield Policies
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-default cursor-pointer">
              <input
                type="checkbox"
                checked={antiBot}
                onChange={(e) => setAntiBot(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="text-fg-primary font-medium">Anti-Bot & Scraper Scrubber</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-default cursor-pointer">
              <input
                type="checkbox"
                checked={streamTokenSigning}
                onChange={(e) => setStreamTokenSigning(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="text-fg-primary font-medium">Stream HMAC Token Signing</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-default cursor-pointer">
              <input
                type="checkbox"
                checked={originLock}
                onChange={(e) => setOriginLock(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="text-fg-primary font-medium">Strict Origin Lock</span>
            </label>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-default">
              <span className="text-fg-primary font-medium">Rate Limit / Min</span>
              <input
                type="number"
                min={10}
                max={600}
                value={rateLimitPerMin}
                onChange={(e) => setRateLimitPerMin(Number(e.target.value))}
                className="w-16 px-1.5 py-0.5 text-right rounded bg-canvas border border-default text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-surface border border-default text-fg-secondary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent-hover text-accent-fg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? <CircleNotch size={14} className="animate-spin" /> : null}
            <span>{editingProject ? 'Update Configuration' : 'Connect Project'}</span>
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
