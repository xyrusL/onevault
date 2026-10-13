import React, { useState } from 'react';
import {
  CalendarBlank,
  Check,
  Clock,
  Copy,
  Key,
  LinkSimple,
  Trash,
} from '@phosphor-icons/react';
import { twoFactorService } from '../services/two-factor.service';
import { TwoFactorTokenItem } from '../types/two-factor.types';

interface TwoFactorDetailsModalContentProps {
  token: TwoFactorTokenItem;
  nowMs: number;
  onClose: () => void;
  onDelete: (tokenId: string) => void;
}

export const TwoFactorDetailsModalContent: React.FC<
  TwoFactorDetailsModalContentProps
> = ({ token, nowMs, onClose, onDelete }) => {
  const [copiedField, setCopiedField] = useState<'code' | 'uri' | null>(null);

  const live = twoFactorService.generateLiveCode(token, nowMs);

  const handleCopy = (text: string, field: 'code' | 'uri') => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1400);
  };

  return (
    <div className="space-y-3.5">
      {/* Live TOTP Summary Card */}
      <div className="rounded-lg bg-elevated border border-default p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-fg-muted leading-none">
            Account Label
          </span>
          <span className="font-mono text-xs font-semibold text-fg-primary leading-none truncate">
            {token.label}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-subtle pt-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted leading-none">
            <Key size={13} weight="duotone" className="shrink-0" />
            <span>Live 2FA Code ({live.remainingSeconds}s)</span>
          </span>

          <div className="inline-flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold tracking-wider text-fg-primary leading-none">
              {live.formattedCode}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(live.rawCode, 'code')}
              title="Copy 2FA code"
              className="inline-flex h-5 w-5 items-center justify-center rounded text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              {copiedField === 'code' ? (
                <Check size={12} weight="bold" className="text-success" />
              ) : (
                <Copy size={12} weight="regular" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Created Date & Created Time Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-lg bg-elevated/60 border border-default p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1.5 leading-none">
            <CalendarBlank size={13} weight="duotone" className="shrink-0" />
            <span>Created Date</span>
          </div>
          <p className="font-mono text-xs font-semibold text-fg-primary leading-none">
            {token.createdDate}
          </p>
        </div>

        <div className="rounded-lg bg-elevated/60 border border-default p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-fg-muted mb-1.5 leading-none">
            <Clock size={13} weight="duotone" className="shrink-0" />
            <span>Created Time</span>
          </div>
          <p className="font-mono text-xs font-semibold text-fg-primary leading-none">
            {token.createdTime}
          </p>
        </div>
      </div>

      {/* OTPAuth URI Preview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-fg-secondary">
          <span className="inline-flex items-center gap-1.5 leading-none">
            <LinkSimple size={13} weight="bold" />
            <span>TOTP URI</span>
          </span>
          <button
            type="button"
            onClick={() => handleCopy(token.otpauthUri, 'uri')}
            className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
          >
            {copiedField === 'uri' ? (
              <>
                <Check size={12} weight="bold" className="text-success" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} weight="regular" />
                <span>Copy URI</span>
              </>
            )}
          </button>
        </div>
        <div className="rounded-md bg-input border border-default px-3 py-2 font-mono text-xs text-fg-secondary truncate">
          {token.otpauthUri}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-subtle">
        <button
          type="button"
          onClick={() => onDelete(token.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-default bg-elevated px-2.5 py-1.5 text-xs font-medium text-danger hover:border-strong transition-colors cursor-pointer"
        >
          <Trash size={13} weight="duotone" />
          <span className="leading-none">Remove</span>
        </button>

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
