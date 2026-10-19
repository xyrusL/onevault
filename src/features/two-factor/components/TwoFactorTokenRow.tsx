import React, { useState } from 'react';
import {
  CaretRight,
  Check,
  Copy,
  Key,
} from '@phosphor-icons/react';
import { twoFactorService } from '../services/two-factor.service';
import { TwoFactorTokenItem } from '../types/two-factor.types';
import { resolveIssuerTheme } from '../utils/two-factor-icon.utils';
import { TwoFactorIssuerIcon } from './TwoFactorIssuerIcon';

interface TwoFactorTokenRowProps {
  item: TwoFactorTokenItem;
  nowMs: number;
  onSelect: (item: TwoFactorTokenItem) => void;
}

export const TwoFactorTokenRow: React.FC<TwoFactorTokenRowProps> = ({
  item,
  nowMs,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);

  const live = twoFactorService.generateLiveCode(item, nowMs);
  const isExpiringSoon = live.remainingSeconds <= 5;
  const theme = resolveIssuerTheme(item.issuer);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(live.rawCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // SVG circular progress ring geometry (r = 7, circumference ~ 43.98)
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (live.progressPercent / 100) * circumference;

  return (
    <div
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className="group hover:bg-elevated/70 transition-all duration-200 cursor-pointer"
    >
      {/* ========================================================= */}
      {/* 1. DEDICATED MOBILE 2FA TOKEN ROW (< sm)                  */}
      {/* Compact card: Timer in top-right, Details on email line   */}
      {/* ========================================================= */}
      <div className="flex sm:hidden flex-col gap-2 p-3 w-full">
        {/* Top line: Icon + Issuer Name on left, Timer in top-right corner */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 p-1 ${theme.bg} ${theme.border} ${theme.text}`}
            >
              <TwoFactorIssuerIcon issuer={item.issuer} size="sm" />
            </div>
            <span className="font-display text-sm font-semibold text-fg-primary truncate leading-tight">
              {item.issuer}
            </span>
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.2 text-[9px] font-mono leading-none ${theme.bg} ${theme.border} ${theme.text}`}
            >
              TOTP
            </span>
          </div>

          {/* Timer in top-right corner */}
          <div
            className="inline-flex items-center gap-1 text-xs font-mono text-fg-muted shrink-0"
            title={`Refreshes in ${live.remainingSeconds}s`}
          >
            <svg className="h-3.5 w-3.5 -rotate-90" viewBox="0 0 18 18">
              <circle
                cx="9"
                cy="9"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-15"
              />
              <circle
                cx="9"
                cy="9"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-300 ${
                  isExpiringSoon ? 'text-danger' : 'text-indigo-400'
                }`}
              />
            </svg>
            <span className={`font-semibold ${isExpiringSoon ? 'text-danger' : 'text-indigo-400/90'}`}>
              {live.remainingSeconds}s
            </span>
          </div>
        </div>

        {/* Second line: Email address (full width, clean typography) */}
        <p className="font-mono text-xs text-fg-muted truncate">
          {item.label}
        </p>

        {/* Third line: Live TOTP Code Pill on left + Details button on same line on right */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-elevated/90 border border-default px-2.5 py-1 shadow-2xs group-hover:border-indigo-500/35 transition-colors">
            <Key size={13} weight="duotone" className="text-indigo-400 shrink-0" />
            <span
              className={`font-mono text-xs font-bold tracking-wider leading-none transition-colors ${
                isExpiringSoon ? 'text-danger animate-pulse' : 'text-emerald-400'
              }`}
            >
              {live.formattedCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy 2FA code"
              className="inline-flex h-4 w-4 items-center justify-center rounded text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={11} weight="bold" className="text-emerald-400" />
              ) : (
                <Copy size={11} weight="regular" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-default bg-elevated px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer shrink-0"
          >
            <span className="leading-none">Details</span>
            <CaretRight size={10} weight="bold" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DEDICATED DESKTOP 2FA TOKEN ROW (>= sm)                */}
      {/* 100% original wide 12-column table grid                   */}
      {/* ========================================================= */}
      <div className="hidden sm:grid sm:grid-cols-12 items-center gap-3 px-4 py-2.5">
        {/* Column 1: Service Issuer & Account Label */}
        <div className="col-span-6 flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 p-1.5 ${theme.bg} ${theme.border} ${theme.text}`}
          >
            <TwoFactorIssuerIcon issuer={item.issuer} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-fg-primary truncate leading-none">
                {item.issuer}
              </span>
              <span
                className={`hidden xs:inline-flex items-center rounded border px-1.5 py-0.2 text-[10px] font-mono leading-none ${theme.bg} ${theme.border} ${theme.text}`}
              >
                TOTP
              </span>
            </div>
            <p className="font-mono text-xs text-fg-muted truncate mt-1 leading-none">
              {item.label}
            </p>
          </div>
        </div>

        {/* Column 2: Live TOTP Code + 30s Countdown Ring */}
        <div className="col-span-4 flex items-center justify-start gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-elevated/90 border border-default px-2.5 py-1 shadow-2xs group-hover:border-indigo-500/35 transition-colors">
            <Key size={13} weight="duotone" className="text-indigo-400 shrink-0" />
            <span
              className={`font-mono text-xs font-bold tracking-wider leading-none transition-colors ${
                isExpiringSoon ? 'text-danger animate-pulse' : 'text-emerald-400'
              }`}
            >
              {live.formattedCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy 2FA code"
              className="inline-flex h-4 w-4 items-center justify-center rounded text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={11} weight="bold" className="text-emerald-400" />
              ) : (
                <Copy size={11} weight="regular" />
              )}
            </button>
          </div>

          {/* Circular 30s Timer */}
          <div
            className="inline-flex items-center gap-1.5 text-xs font-mono text-fg-muted leading-none"
            title={`Refreshes in ${live.remainingSeconds}s`}
          >
            <svg className="h-4 w-4 -rotate-90" viewBox="0 0 18 18">
              <circle
                cx="9"
                cy="9"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-15"
              />
              <circle
                cx="9"
                cy="9"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-300 ${
                  isExpiringSoon ? 'text-danger' : 'text-indigo-400'
                }`}
              />
            </svg>
            <span className={`w-6 font-semibold ${isExpiringSoon ? 'text-danger' : 'text-indigo-400/90'}`}>
              {live.remainingSeconds}s
            </span>
          </div>
        </div>

        {/* Column 3: Details Action Trigger */}
        <div className="col-span-2 flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-default bg-elevated px-2.5 py-1 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:border-strong hover:bg-surface-solid transition-all duration-200 cursor-pointer"
          >
            <span className="leading-none">Details</span>
            <CaretRight
              size={11}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
