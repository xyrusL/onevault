import React from 'react';
import { ClockCountdown, Plus, ShieldCheck } from '@phosphor-icons/react';

interface TwoFactorHeaderProps {
  onCreateClick: () => void;
  totalTokensCount: number;
}

export const TwoFactorHeader: React.FC<TwoFactorHeaderProps> = ({
  onCreateClick,
  totalTokensCount,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary leading-tight">
            2FA
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 text-[10px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            TOTP Active ({totalTokensCount})
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium">
            <ShieldCheck size={11} weight="bold" />
            RFC 6238 Compliant
          </span>
        </div>
        <p className="mt-0.5 text-xs text-fg-secondary">
          Time-based one-time passwords (TOTP) processed client-side with zero edge storage.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg-secondary shadow-2xs">
          <ClockCountdown size={14} weight="duotone" className="text-indigo-400 shrink-0" />
          <span>
            Clock: <strong className="text-fg-primary font-semibold">30s Local Ticker</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onCreateClick}
          className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
        >
          <Plus
            size={14}
            weight="bold"
            className="transition-transform duration-200 group-hover:rotate-90"
          />
          <span className="leading-none">New 2FA</span>
        </button>
      </div>
    </header>
  );
};
