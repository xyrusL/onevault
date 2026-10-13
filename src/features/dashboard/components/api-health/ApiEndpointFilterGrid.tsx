import React from 'react';
import {
  CheckCircle,
  WarningCircle,
  XCircle,
  Funnel,
  Notebook,
  PaperPlaneTilt,
  Fingerprint,
  UserCheck,
  HardDrives,
  ShareNetwork,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import type { ApiEndpointHealth } from '../../types/dashboard.types';
import { getEndpointStatusSummary } from '../../../../shared/constants/api-status-catalog';

interface ApiEndpointFilterGridProps {
  endpoints: ApiEndpointHealth[];
  selectedKeys: string[];
  isPinging?: boolean;
  onToggle: (key: string) => void;
  onOpenHistory?: (endpoint: ApiEndpointHealth) => void;
}

const getEndpointIcon = (category: string, color: string) => {
  switch (category) {
    case 'notes':
      return <Notebook size={15} weight="duotone" style={{ color }} />;
    case 'mail':
      return <PaperPlaneTilt size={15} weight="duotone" style={{ color }} />;
    case 'two_factor':
      return <Fingerprint size={15} weight="duotone" style={{ color }} />;
    case 'auth':
      return <UserCheck size={15} weight="duotone" style={{ color }} />;
    case 'backup':
      return <HardDrives size={15} weight="duotone" style={{ color }} />;
    default:
      return <ShareNetwork size={15} weight="duotone" style={{ color }} />;
  }
};

export const ApiEndpointFilterGrid: React.FC<ApiEndpointFilterGridProps> = ({
  endpoints,
  selectedKeys,
  isPinging = false,
  onToggle,
  onOpenHistory,
}) => {
  const isFiltered = selectedKeys.length > 0;

  return (
    <div className="pt-0.5">
      <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted uppercase tracking-wider mb-2">
        <div className="flex items-center gap-1.5">
          <Funnel size={12} weight="duotone" className="text-accent" />
          <span>Interactive Endpoint Filter (6 APIs)</span>
        </div>
        <span className="text-[10px] text-zinc-400 lowercase hidden sm:inline">
          {isFiltered
            ? `${selectedKeys.length} selected · click to add/remove`
            : 'click to filter single or multiple curves'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {endpoints.map((ep) => {
          const isDown = ep.status === 'down';
          const isDegraded = ep.status === 'degraded';
          const isSelected = selectedKeys.includes(ep.key as string);
          const isDimmed = isFiltered && !isSelected;

          const catSummary = getEndpointStatusSummary(ep.key || ep.category);
          const statusLabel =
            ep.statusText ||
            (isDown
              ? catSummary.outageLabel
              : isDegraded
              ? catSummary.degradedLabel
              : catSummary.healthyLabel);
          const statusMeaning = ep.statusMeaning || catSummary.healthyMeaning;

          return (
            <button
              key={ep.path}
              type="button"
              onClick={() => onToggle(ep.key as string)}
              title={`${ep.name} (${statusLabel}): ${statusMeaning}`}
              style={{
                borderColor: isSelected ? ep.color : undefined,
                boxShadow: isSelected ? `0 0 14px ${ep.color}30` : undefined,
                backgroundColor: isSelected ? `${ep.color}14` : undefined,
              }}
              className={`px-2.5 py-2 rounded-xl border text-xs font-mono text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'ring-1'
                  : isDimmed
                  ? 'opacity-50 hover:opacity-90 bg-elevated/20 border-subtle'
                  : isDown
                  ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:border-red-400/50'
                  : isDegraded
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:border-amber-400/50'
                  : 'bg-elevated/40 border-subtle text-fg-primary hover:border-white/20 hover:bg-elevated/70'
              }`}
            >
              {/* Top Row: Circular Icon on Left, Circular Status & Value Pill on Right */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-transform"
                  style={{
                    backgroundColor: `${ep.color || '#3b82f6'}18`,
                    borderColor: `${ep.color || '#3b82f6'}35`,
                  }}
                >
                  {getEndpointIcon(ep.category, ep.color || '#3b82f6')}
                </div>

                <div className="flex items-center gap-1">
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenHistory(ep);
                      }}
                      title={`View ${ep.name} incident & latency audit history`}
                      className="p-1 rounded-md hover:bg-white/15 text-fg-muted hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <ClockCounterClockwise size={12} weight="bold" />
                    </button>
                  )}
                  {isPinging ? (
                    <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ep.color || '#3b82f6' }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: ep.color || '#3b82f6' }} />
                    </span>
                  ) : isDown ? (
                    <XCircle size={12} weight="fill" className="text-red-400 shrink-0" />
                  ) : isDegraded ? (
                    <WarningCircle size={12} weight="fill" className="text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle size={12} weight="fill" className="text-emerald-400 shrink-0" />
                  )}
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: ep.color || '#3b82f6' }}
                  >
                    {`${ep.latencyMs}ms`}
                  </span>
                </div>
              </div>

              {/* Endpoint Name & Path */}
              <div className="min-w-0">
                <div className="font-semibold text-fg-primary truncate text-[11px] leading-snug">
                  {ep.name}
                </div>
                <div className="text-[9.5px] text-fg-muted font-mono truncate leading-none mt-0.5">
                  {ep.path}
                </div>
              </div>

              {/* Bottom Status Pill */}
              <div className="mt-2 pt-1.5 border-t border-subtle/50 flex items-center justify-between text-[10px]">
                <span
                  className="font-medium truncate text-[9.5px]"
                  style={{
                    color: isDown ? '#fca5a5' : isDegraded ? '#fde68a' : '#a7f3d0',
                  }}
                  title={statusMeaning}
                >
                  {statusLabel}
                </span>
                <span
                  className="font-mono text-[9px] font-semibold uppercase tracking-wider shrink-0 ml-1"
                  style={{
                    color: isDown ? '#f87171' : isDegraded ? '#fbbf24' : '#34d399',
                  }}
                >
                  {ep.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
