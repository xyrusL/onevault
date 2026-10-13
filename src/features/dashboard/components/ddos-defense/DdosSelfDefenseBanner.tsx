import React from 'react';
import {
  ShieldWarning,
  ShieldCheck,
  LockKey,
  Database,
  ArrowUpRight,
  Stack,
} from '@phosphor-icons/react';
import type { DdosDefenseTelemetry } from '../../types/dashboard.types';

interface DdosSelfDefenseBannerProps {
  telemetry: DdosDefenseTelemetry;
  onOpenModal: () => void;
}

export const DdosSelfDefenseBanner: React.FC<DdosSelfDefenseBannerProps> = ({
  telemetry,
  onOpenModal,
}) => {
  return (
    <div
      className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${
        telemetry.active
          ? 'bg-gradient-to-r from-red-500/15 via-amber-500/10 to-emerald-500/10 border-red-500/40 shadow-xs'
          : 'bg-surface/80 border-default'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              telemetry.active
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {telemetry.active ? (
              <ShieldWarning size={20} weight="fill" />
            ) : (
              <ShieldCheck size={20} weight="fill" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-fg-primary tracking-tight">
                {telemetry.active
                  ? 'Autonomous Self-Defense Active: Attack Detected · Layers 1–5 Engaged'
                  : 'Autonomous Self-Defense: Site Safe · Operating in Normal Mode'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold">
                <Stack size={11} weight="fill" />
                <span>Layers 1–5 Active</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-semibold">
                <Database size={11} weight="fill" />
                <span>{telemetry.d1QueriesSaved.toLocaleString()} D1 Queries Saved</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-semibold">
                <LockKey size={11} weight="fill" />
                <span>1 Device Pinned</span>
              </span>
            </div>

            <p className="text-[11px] text-fg-secondary mt-0.5 font-sans">
              Live Incoming: {telemetry.peakRps.toLocaleString()} req/s ·{' '}
              {telemetry.totalBlockedAtEdge.toLocaleString()} attack requests from{' '}
              {telemetry.incomingCountries.filter((c) => c.severity !== 'safe').length} countries
              scrubbed ({telemetry.mitigationRatePct}%) · Automatically returns to normal when safe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs"
          >
            <span>View Live Defense Monitor</span>
            <ArrowUpRight size={13} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};
