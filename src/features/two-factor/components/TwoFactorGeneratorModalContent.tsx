import React, { useMemo, useState } from 'react';
import { Check, ClockCountdown, Copy, Key, X } from '@phosphor-icons/react';
import { twoFactorService } from '../services/two-factor.service';

interface TwoFactorGeneratorModalContentProps {
  nowMs: number;
  onClose: () => void;
}

export const TwoFactorGeneratorModalContent: React.FC<
  TwoFactorGeneratorModalContentProps
> = ({ nowMs, onClose }) => {
  const [rawInput, setRawInput] = useState('');
  const [copied, setCopied] = useState(false);

  const preview = useMemo(
    () => twoFactorService.generateFromRawInput(rawInput, nowMs),
    [rawInput, nowMs]
  );

  const isExpiringSoon = preview ? preview.remainingSeconds <= 5 : false;

  const handleCopy = () => {
    if (!preview) return;
    navigator.clipboard.writeText(preview.rawCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // SVG circular countdown ring geometry
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = preview
    ? circumference - (preview.progressPercent / 100) * circumference
    : circumference;

  return (
    <div className="space-y-4">
      {/* Secret / URI Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-fg-secondary">
          <label htmlFor="twofa-generator-input">2FA Secret Key or TOTP URI</label>
          {rawInput && (
            <button
              type="button"
              onClick={() => setRawInput('')}
              className="inline-flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              <X size={11} weight="bold" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
            <Key size={14} weight="duotone" />
          </span>
          <input
            id="twofa-generator-input"
            type="text"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste 2FA secret key (e.g. afasdf3423) or otpauth://totp/..."
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-8 pr-3 py-2 font-mono text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
        </div>
      </div>

      {/* Live Auto-Refreshing Result */}
      {preview ? (
        <div className="rounded-xl bg-elevated border border-default p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-fg-primary truncate">
                {preview.issuer
                  ? `${preview.issuer}${preview.label ? ` · ${preview.label}` : ''}`
                  : 'Live 2FA Code'}
              </span>
            </div>

            <div
              className="inline-flex items-center gap-1.5 text-xs font-mono shrink-0"
              title={`Auto-refreshes every ${preview.period}s`}
            >
              <svg className="h-4 w-4 -rotate-90" viewBox="0 0 22 22">
                <circle
                  cx="11"
                  cy="11"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-fg-muted opacity-20"
                />
                <circle
                  cx="11"
                  cy="11"
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
              <span
                className={`font-semibold tabular-nums ${
                  isExpiringSoon ? 'text-danger' : 'text-indigo-400'
                }`}
              >
                {preview.remainingSeconds}s
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface border border-default px-3.5 py-3">
            <span
              className={`font-mono text-2xl font-bold tracking-[0.2em] tabular-nums leading-none transition-colors ${
                isExpiringSoon ? 'text-danger animate-pulse' : 'text-emerald-400'
              }`}
            >
              {preview.formattedCode}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-default bg-elevated hover:bg-surface-solid px-2.5 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check size={13} weight="bold" className="text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} weight="regular" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Live Refresh Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-1 w-full rounded-full bg-surface overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExpiringSoon ? 'bg-danger' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, preview.progressPercent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted">
              <span>
                Refreshes in {preview.remainingSeconds}s
              </span>
              <span>
                {preview.algorithm} · {preview.digits} digits · {preview.period}s cycle
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-elevated/50 border border-dashed border-default p-5 text-center space-y-1.5">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-default text-fg-muted">
            <ClockCountdown size={16} weight="duotone" />
          </div>
          <p className="text-xs font-medium text-fg-secondary">
            Waiting for a 2FA secret key
          </p>
          <p className="text-[11px] text-fg-muted">
            Type or paste a secret key above to view the live auto-refreshing code and countdown.
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end pt-2.5 border-t border-subtle">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
