import React from 'react';
import {
  ShieldWarning,
  ShieldCheck,
  WarningOctagon,
  Clock,
  Copy,
  Check,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import type { ImmuneActorRecord } from '../../types/dashboard.types';

interface ThreatIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: ImmuneActorRecord | null;
}

export const ThreatIncidentModal: React.FC<ThreatIncidentModalProps> = ({
  isOpen,
  onClose,
  incident,
}) => {
  const [hasCopied, setHasCopied] = React.useState(false);

  if (!incident) return null;

  const isBlock = incident.action === 'PENETRATION_BLOCK';
  const isQuarantine = incident.action === 'TEMP_QUARANTINE';
  const isRateLimit = incident.action === 'RATE_LIMITED';

  const actionLabel = isBlock
    ? 'BLOCKED (HTTP 403)'
    : isQuarantine
    ? 'QUARANTINE (HTTP 403 · 10m)'
    : isRateLimit
    ? 'RATE LIMITED (HTTP 429 · Soft)'
    : 'ALLOWED (Zero Penalty)';

  const actionColor = isBlock
    ? 'text-rose-400 bg-rose-500/15 border-rose-500/35'
    : isQuarantine
    ? 'text-amber-400 bg-amber-500/15 border-amber-500/35'
    : isRateLimit
    ? 'text-sky-400 bg-sky-500/15 border-sky-500/35'
    : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/35';

  const handleCopyIp = () => {
    void navigator.clipboard.writeText(incident.actorIp);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Incident Details"
      subtitle={`${incident.actorIp} (${incident.countryCode}) · ${incident.countryName}`}
      maxWidthClass="max-w-xl"
      icon={
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
            isBlock
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              : isQuarantine
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
          }`}
        >
          {isBlock ? (
            <WarningOctagon size={18} weight="duotone" />
          ) : isQuarantine ? (
            <ShieldWarning size={18} weight="duotone" />
          ) : (
            <ShieldCheck size={18} weight="duotone" />
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full font-mono text-xs">
          <button
            type="button"
            onClick={handleCopyIp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
          >
            {hasCopied ? (
              <>
                <Check size={13} weight="bold" className="text-emerald-400" />
                <span className="text-emerald-300">IP Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} weight="bold" />
                <span>Copy IP</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/20 hover:bg-cyan-500/30 font-semibold text-cyan-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-3 font-sans text-xs">
        {/* Top Summary Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0b10] border border-white/10 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-8 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[11px] font-bold text-white">
              {incident.countryCode}
            </span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{incident.actorIp}</span>
              </div>
              <div className="text-[10px] text-zinc-400 truncate max-w-[260px]">
                {incident.countryName} · {incident.asnOrg}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold font-mono ${actionColor}`}>
              {actionLabel}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Risk Score: <strong className="text-white">{incident.riskScore}</strong>
            </span>
          </div>
        </div>

        {/* Threat Vector Card */}
        <div className="p-3 rounded-xl bg-surface-solid border border-white/10 space-y-2 font-mono">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Detection Vector</span>
            <span className="text-rose-400">{incident.requestCount} requests</span>
          </div>
          <div className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
            {incident.detectionVector}
          </div>
          <div className="text-[11px] text-zinc-300">
            <span className="text-zinc-500">Client Signature: </span>
            {incident.userAgentSummary}
          </div>
        </div>

        {/* Targeted Endpoints */}
        <div className="p-3 rounded-xl bg-surface-solid border border-white/10 space-y-1.5 font-mono">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
            Targeted Paths
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {incident.targetPaths.map((path, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#0b0b10] border border-cyan-500/30 text-cyan-300 text-[10.5px] font-mono break-all"
              >
                {path}
              </span>
            ))}
          </div>
        </div>

        {/* Timing and Quarantine Status */}
        <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
          <div className="p-2.5 rounded-xl bg-[#0b0b10] border border-white/5 space-y-0.5">
            <span className="text-zinc-400 flex items-center gap-1">
              <Clock size={12} /> Last Activity
            </span>
            <div className="text-white font-semibold">
              {new Date(incident.lastSeenAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0b0b10] border border-white/5 space-y-0.5">
            <span className="text-zinc-400">Temporary Quarantine</span>
            <div className="text-amber-400 font-semibold truncate">
              {incident.quarantineExpiresAt
                ? `Expires at ${new Date(incident.quarantineExpiresAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}`
                : 'None (Per-Request Surgical)'}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
