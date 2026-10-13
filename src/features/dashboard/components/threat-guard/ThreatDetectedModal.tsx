import React from 'react';
import {
  ShieldWarning,
  WarningOctagon,
  ArrowRight,
  LockKey,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';

interface ThreatDetectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  threatMessage: string;
  onNavigateToDefense: () => void;
}

export const ThreatDetectedModal: React.FC<ThreatDetectedModalProps> = ({
  isOpen,
  onClose,
  threatMessage,
  onNavigateToDefense,
}) => {
  // Extract specific details if present in message
  const isBlock = threatMessage.toLowerCase().includes('block') || threatMessage.includes('403');
  const isQuarantine = threatMessage.toLowerCase().includes('quarantine');
  const isRateLimit = threatMessage.toLowerCase().includes('rate-limit') || threatMessage.includes('429');

  const actionLabel = isBlock
    ? 'PENETRATION BLOCK (403)'
    : isQuarantine
    ? 'TEMPORARY QUARANTINE (10m · 403)'
    : isRateLimit
    ? 'RATE LIMITED (429)'
    : 'SURGICAL ACTION TAKEN';

  const actionColor = isBlock
    ? 'text-rose-400 bg-rose-500/15 border-rose-500/35'
    : isQuarantine
    ? 'text-amber-400 bg-amber-500/15 border-amber-500/35'
    : 'text-sky-400 bg-sky-500/15 border-sky-500/35';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Threat Intercepted by Self-Defense"
      subtitle="Suspicious action detected and mitigated in Worker RAM"
      maxWidthClass="max-w-lg"
      icon={
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <WarningOctagon size={18} weight="duotone" />
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToDefense();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
          >
            <span>View Threat Defense</span>
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      }
    >
      <div className="space-y-3 font-sans text-xs">
        {/* Action Taken Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b0b10] border border-white/10 font-mono">
          <span className="text-[11px] text-zinc-400">Security Algorithm Action:</span>
          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${actionColor}`}>
            {actionLabel}
          </span>
        </div>

        {/* Detailed Interception Message */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-300 font-mono text-[11px] font-bold">
            <ShieldWarning size={14} weight="fill" className="text-rose-400 shrink-0" />
            <span>Detection Details</span>
          </div>
          <p className="text-[11.5px] text-zinc-200 leading-relaxed font-mono break-words">
            {threatMessage}
          </p>
        </div>

        {/* Safe Isolation Guarantee Notice */}
        <div className="p-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 text-[11px] text-emerald-300 leading-snug font-mono flex items-start gap-2">
          <LockKey size={14} weight="bold" className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Surgical Isolation:</strong> Only the suspicious payload or offending client IP was restricted in memory. Normal users experience 0ms delay and zero site downtime.
          </span>
        </div>
      </div>
    </BaseModal>
  );
};
