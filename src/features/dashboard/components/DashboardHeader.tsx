import React from 'react';
import {
  ArrowsClockwise,
  CloudCheck,
  Database,
  GlobeHemisphereWest,
  MapTrifold,
  ShieldCheck,
  SquaresFour,
} from '@phosphor-icons/react';
import type { DashboardViewMode } from '../types/dashboard.types';

interface DashboardHeaderProps {
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastSyncedAt?: string;
  viewMode?: DashboardViewMode;
  onViewModeChange?: (mode: DashboardViewMode) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isRefreshing = false,
  onRefresh,
  lastSyncedAt,
  viewMode = 'overview',
  onViewModeChange,
}) => {
  const formattedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-subtle">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary">
            Dashboard
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Vault
          </span>
        </div>
        <p className="mt-0.5 text-xs text-fg-secondary">
          {viewMode === 'globe'
            ? '3D interactive global domain routing topology & Cloudflare edge station telemetry.'
            : viewMode === 'flatmap'
            ? 'Global flat map routing intelligence & regional edge comparison across active domains.'
            : viewMode === 'threat-defense'
            ? 'Behavioral intrusion prevention, security flow pipeline, threat telemetry graphs & 0% false-positive verification.'
            : 'System telemetry, routing topology, and cross-vault security metrics.'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap text-xs shrink-0 overflow-x-auto">
        {/* View Mode Switcher: Vault Overview vs 3D Global Globe vs Flat Map */}
        {onViewModeChange && (
          <div
            role="tablist"
            aria-label="Dashboard view mode"
            className="inline-flex items-center rounded-lg border border-default bg-surface p-0.5 shadow-2xs shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'overview'}
              onClick={() => onViewModeChange('overview')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer leading-none ${
                viewMode === 'overview'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <SquaresFour size={13} weight="duotone" className="shrink-0" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'globe'}
              onClick={() => onViewModeChange('globe')}
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer leading-none ${
                viewMode === 'globe'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.28)]'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <GlobeHemisphereWest
                size={13}
                weight="duotone"
                className={viewMode === 'globe' ? 'animate-spin text-sky-400 shrink-0' : 'text-sky-400 shrink-0'}
                style={viewMode === 'globe' ? { animationDuration: '10s' } : undefined}
              />
              <span>Global Globe</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'flatmap'}
              onClick={() => onViewModeChange('flatmap')}
              className={`hidden lg:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer leading-none ${
                viewMode === 'flatmap'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.28)]'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <MapTrifold size={13} weight="duotone" className="text-orange-400 shrink-0" />
              <span>Flat Map</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'threat-defense'}
              onClick={() => onViewModeChange('threat-defense')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer leading-none ${
                viewMode === 'threat-defense'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.28)]'
                  : 'text-fg-secondary hover:text-fg-primary border border-transparent'
              }`}
            >
              <ShieldCheck size={13} weight="duotone" className="text-cyan-400 shrink-0" />
              <span>Threat Defense</span>
            </button>
          </div>
        )}

        {/* Edge status badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-secondary shadow-2xs shrink-0">
          <CloudCheck size={14} weight="duotone" className="text-sky-500 shrink-0" />
          <span>Edge: <strong className="text-fg-primary font-semibold">Cloudflare</strong></span>
        </div>

        {/* D1 Storage badge */}
        <div className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-secondary shadow-2xs shrink-0">
          <Database size={14} weight="duotone" className="text-emerald-500 shrink-0" />
          <span>Storage: <strong className="text-fg-primary font-semibold">D1 Connected</strong></span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title={formattedTime ? `Last updated: ${formattedTime}` : 'Refresh telemetry'}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-default bg-elevated hover:bg-surface px-2 sm:px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            <ArrowsClockwise
              size={13}
              weight="bold"
              className={isRefreshing ? 'animate-spin text-accent' : ''}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
