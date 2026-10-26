import React from 'react';
import {
  FilmReel,
  Browsers,
  Code,
  ShieldCheck,
  Power,
  Gear,
  Trash,
  Lock,
  Eye,
  Pulse,
  ShieldWarning,
} from '@phosphor-icons/react';
import type { ProjectItem } from '../types/projects.types';

interface ProjectRowProps {
  project: ProjectItem;
  onToggleStatus: (project: ProjectItem) => void;
  onEdit: (project: ProjectItem) => void;
  onIntegrate: (project: ProjectItem) => void;
  onRequestDelete: (project: ProjectItem) => void;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({
  project,
  onToggleStatus,
  onEdit,
  onIntegrate,
  onRequestDelete,
}) => {
  const isProtected = project.status === 'active';
  const isConnecting = project.status === 'connecting';

  // Dynamic icon based on project slug or name
  const isStreamingApp =
    project.slug.includes('gigamaxx') ||
    project.slug.includes('stream') ||
    project.name.toLowerCase().includes('movie') ||
    project.name.toLowerCase().includes('video');

  const activeShieldLayersCount = [
    project.shieldPolicy.antiBot,
    project.shieldPolicy.streamTokenSigning,
    project.shieldPolicy.originLock,
    project.shieldPolicy.stealth404,
  ].filter(Boolean).length;

  return (
    <div className="group relative flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-3 px-4 py-3 hover:bg-surface/60 transition-colors">
      {/* Col 1: Project / Application Info (Col 5) */}
      <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0 w-full">
        {/* Dynamic Icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            isProtected
              ? isStreamingApp
                ? 'bg-rose-500/12 text-rose-400 border-rose-500/25'
                : 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25'
              : isConnecting
              ? 'bg-amber-500/12 text-amber-400 border-amber-500/25 animate-pulse'
              : 'bg-elevated text-fg-muted border-default'
          }`}
        >
          {isStreamingApp ? (
            <FilmReel size={18} weight="duotone" />
          ) : project.siteUrl ? (
            <Browsers size={18} weight="duotone" />
          ) : (
            <Code size={18} weight="duotone" />
          )}
        </div>

        {/* Title, Slug & Domains */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-xs font-bold text-fg-primary truncate">
              {project.name}
            </span>
            <span className="rounded bg-elevated border border-default px-1.5 py-0.2 text-[10px] font-mono text-fg-muted">
              /{project.slug}
            </span>
          </div>
          <p className="text-[11px] text-fg-muted truncate mt-0.5">
            {project.description || `${project.domains.join(', ')}`}
          </p>
        </div>
      </div>

      {/* Col 2: Concealed Upstream API (Col 3) */}
      <div className="col-span-12 sm:col-span-3 flex flex-col gap-1 min-w-0 w-full sm:w-auto">
        <div className="flex items-center gap-1.5">
          <Lock size={12} weight="bold" className="text-sky-400 shrink-0" />
          <span
            className="text-xs font-mono text-sky-300 truncate max-w-[200px]"
            title={project.upstreamApi ? `Upstream: ${project.upstreamApi}` : 'OneVault Gateway'}
          >
            {project.upstreamApi
              ? project.upstreamApi.replace(/^https?:\/\//, '').split('/')[0] + ' (Masked)'
              : 'OneVault Masked Gateway'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-fg-muted">
          <ShieldCheck size={12} weight="duotone" className="text-emerald-400 shrink-0" />
          <span>{activeShieldLayersCount} Shield Layers Active</span>
        </div>
      </div>

      {/* Col 3: Live Telemetry & D1 Stats (Col 2) */}
      <div className="col-span-12 sm:col-span-2 flex items-center gap-3 sm:gap-4 text-xs font-mono">
        <div className="flex items-center gap-1" title="Real requests today">
          <Pulse size={12} weight="bold" className="text-sky-400 shrink-0" />
          <span className="text-fg-primary font-semibold">
            {project.stats.totalRequestsToday.toLocaleString()}
          </span>
        </div>

        {project.stats.blockedThreatsToday > 0 ? (
          <div className="flex items-center gap-1 text-rose-400" title="Scrapers blocked today">
            <ShieldWarning size={12} weight="bold" className="shrink-0" />
            <span className="font-semibold">{project.stats.blockedThreatsToday}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-emerald-400/80" title="Zero active breaches">
            <ShieldCheck size={12} weight="bold" className="shrink-0" />
            <span>0</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-fg-muted text-[11px]" title="Active Viewers">
          <Eye size={12} weight="bold" className="shrink-0" />
          <span>{project.stats.activeViewers}</span>
        </div>
      </div>

      {/* Col 4: Status Toggle & Actions (Col 2) */}
      <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
        {/* Status Button: Protected (Green) / Pairing (Amber) / Unplugged (Gray) */}
        {isConnecting ? (
          <button
            type="button"
            onClick={() => onIntegrate(project)}
            title="Waiting for project handshake. Click to view pairing token."
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 cursor-pointer transition-all animate-pulse"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>PAIRING...</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleStatus(project)}
            title={isProtected ? 'Click to unplug protection' : 'Click to activate shield'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
              isProtected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-elevated text-fg-muted border-default hover:text-fg-primary'
            }`}
          >
            <Power size={11} weight="bold" />
            <span>{isProtected ? 'PROTECTED' : 'UNPLUGGED'}</span>
          </button>
        )}

        {/* Integration Code Snippet */}
        <button
          type="button"
          onClick={() => onIntegrate(project)}
          title="Connect Snippet & Gateway Token"
          className="p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-default text-fg-muted hover:text-fg-primary transition-all cursor-pointer"
        >
          <Code size={13} weight="bold" />
        </button>

        {/* Edit Configuration */}
        <button
          type="button"
          onClick={() => onEdit(project)}
          title="Configure Shield & Concealed APIs"
          className="p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-default text-fg-muted hover:text-fg-primary transition-all cursor-pointer"
        >
          <Gear size={13} weight="bold" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onRequestDelete(project)}
          title="Remove Project"
          className="p-1.5 rounded-md hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 text-fg-muted hover:text-rose-400 transition-all cursor-pointer"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
};
