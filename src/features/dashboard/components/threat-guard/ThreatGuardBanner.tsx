import React from 'react';
import {
  ArrowUpRight,
  CheckCircle,
  Pulse,
  ShieldPlus,
} from '@phosphor-icons/react';
import type { ImmuneSystemTelemetry } from '../../types/dashboard.types';

interface ThreatGuardBannerProps {
  telemetry: ImmuneSystemTelemetry;
  onOpenThreatDefense: () => void;
}

export const ThreatGuardBanner: React.FC<ThreatGuardBannerProps> = ({
  telemetry,
  onOpenThreatDefense,
}) => {
  const { verificationSuite } = telemetry;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-surface to-emerald-500/10 p-3 sm:px-4 sm:py-3 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Threat Guard Identity & Live Status */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-400">
            <ShieldPlus size={19} weight="duotone" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                <Pulse size={11} weight="bold" className="animate-pulse" />
                Adaptive Threat Guard (IPS)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                <CheckCircle size={11} weight="fill" />
                {verificationSuite.falsePositiveRatePct.toFixed(2)}% False Positives ({verificationSuite.legitimateTestsPassed}/{verificationSuite.legitimateTestsTotal} Safe User Tests Passed)
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                {telemetry.pageScansIntercepted} Route Scans Quarantined · {telemetry.penetrationAttemptsBlocked} Exploits Blocked
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-fg-secondary truncate">
              Per-Actor Intrusion Prevention: Surgically blocks &amp; rate-limits route scanners, Canary Honeypot probes (
              <span className="font-mono text-fg-primary">/.env</span>,{' '}
              <span className="font-mono text-fg-primary">/wp-admin</span>), and SQLi without locking down normal users.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenThreatDefense}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
          >
            <span>View Threat Defense Telemetry ({verificationSuite.passedTests}/{verificationSuite.totalTests})</span>
            <ArrowUpRight size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};
