import React from 'react';
import {
  ShieldCheck,
  Power,
  GearSix,
  Code,
  Trash,
  Globe,
  FilmReel,
  Users,
  Eye,
  Lightning,
} from '@phosphor-icons/react';
import type { ProjectItem, ProjectStatus } from '../types/projects.types';

export interface ProjectCardProps {
  project: ProjectItem;
  onToggleStatus: (id: string, newStatus: ProjectStatus) => void;
  onEdit: (project: ProjectItem) => void;
  onViewIntegration: (project: ProjectItem) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onToggleStatus,
  onEdit,
  onViewIntegration,
  onDelete,
}) => {
  const isPluggedIn = project.status === 'active';
  const isGigaMaxx = project.slug === 'gigamaxx';

  return (
    <div className="relative rounded-2xl bg-surface border border-default p-5 space-y-4 hover:border-fg-muted/40 transition-all shadow-sm">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-black/40 border border-default flex items-center justify-center shrink-0">
            {isGigaMaxx ? (
              <FilmReel size={24} weight="duotone" className="text-red-500" />
            ) : (
              <Globe size={24} weight="duotone" className="text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-fg-primary tracking-tight">
                {project.name}
              </h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-fg-muted border border-default">
                /{project.slug}
              </span>
            </div>

            <p className="text-xs text-fg-muted line-clamp-1 mt-0.5">
              {project.description || 'Protected by OneVault Edge Shield'}
            </p>
          </div>
        </div>

        {/* 1-Click Plug-In / Plug-Out Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(project.id, isPluggedIn ? 'disabled' : 'active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isPluggedIn
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 hover:bg-emerald-500/25'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-750'
            }`}
            title="Click to toggle connection (Plug-in / Plug-out)"
          >
            <Power size={13} weight="bold" />
            <span>{isPluggedIn ? 'PROTECTED (ON)' : 'UNPLUGGED (OFF)'}</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-default text-xs">
        <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-default">
          <div className="flex items-center gap-1 text-[11px] text-fg-muted">
            <Users size={12} className="text-emerald-400" />
            <span>Active Viewers</span>
          </div>
          <p className="text-sm font-bold text-fg-primary mt-1 flex items-center gap-1.5">
            {isPluggedIn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {isPluggedIn ? project.stats.activeViewers : 0}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-default">
          <div className="flex items-center gap-1 text-[11px] text-fg-muted">
            <Eye size={12} className="text-blue-400" />
            <span>Requests Today</span>
          </div>
          <p className="text-sm font-bold text-fg-primary mt-1">
            {project.stats.totalRequestsToday.toLocaleString()}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-default">
          <div className="flex items-center gap-1 text-[11px] text-fg-muted">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Scrapers Blocked</span>
          </div>
          <p className="text-sm font-bold text-emerald-400 mt-1">
            {project.stats.blockedThreatsToday}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-default">
          <div className="flex items-center gap-1 text-[11px] text-fg-muted">
            <Lightning size={12} className="text-amber-400" />
            <span>Edge Latency</span>
          </div>
          <p className="text-sm font-bold text-fg-primary mt-1">
            {project.stats.avgLatencyMs}ms
          </p>
        </div>
      </div>

      {/* Shield Policy Pills & Allowed Domains */}
      <div className="space-y-2 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-fg-secondary mr-1">Active Shield:</span>
          {project.shieldPolicy.antiBot && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
              Anti-Bot Scrubber
            </span>
          )}
          {project.shieldPolicy.streamTokenSigning && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400">
              HMAC Tokenized Streams
            </span>
          )}
          {project.shieldPolicy.originLock && (
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-400">
              Origin Locked
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
            {project.shieldPolicy.rateLimitPerMin} req/min
          </span>
        </div>

        <div className="text-[11px] text-fg-muted truncate">
          <span className="font-semibold text-fg-secondary">Allowed Domains:</span>{' '}
          {project.domains.join(', ')}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-default">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewIntegration(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-muted/80 border border-default text-xs font-semibold text-fg-primary cursor-pointer transition-colors"
          >
            <Code size={13} />
            <span>Connect Snippet</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-surface-muted/80 border border-default text-xs font-semibold text-fg-primary cursor-pointer transition-colors"
          >
            <GearSix size={13} />
            <span>Configure</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onDelete(project.id)}
          className="p-1.5 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Delete project"
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
};
