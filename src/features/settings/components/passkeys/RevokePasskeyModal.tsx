import React from 'react';
import {
  Warning,
  Trash,
  CircleNotch,
  Fingerprint,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';

interface RevokePasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  passkeyName: string;
  deviceLabel?: string;
  isDeleting: boolean;
}

export const RevokePasskeyModal: React.FC<RevokePasskeyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  passkeyName,
  deviceLabel,
  isDeleting,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      title="Revoke Passkey Access"
      subtitle="Remove passwordless authorization for this device"
      icon={<Warning size={18} weight="fill" className="text-red-500" />}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Device Information Card */}
        <div className="rounded-xl bg-surface border border-default p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            <Fingerprint size={22} weight="duotone" />
          </div>
          <div className="min-w-0 flex-1 font-mono">
            <h4 className="text-sm font-semibold text-fg-primary truncate">
              {passkeyName}
            </h4>
            {deviceLabel && (
              <p className="text-xs text-fg-muted mt-0.5">{deviceLabel}</p>
            )}
          </div>
        </div>

        {/* Warning Explanation Box */}
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-500 font-semibold font-display">
            <Warning size={16} weight="fill" className="shrink-0" />
            <span>Are you sure you want to revoke this passkey?</span>
          </div>
          <p className="text-fg-secondary leading-relaxed font-mono text-[11px]">
            Once revoked, this device or security key will immediately lose access and cannot be used
            to sign in to OneVault without entering your administrator master password.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-fg-secondary hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                <span>Revoking Access...</span>
              </>
            ) : (
              <>
                <Trash size={14} weight="bold" />
                <span>Confirm Revoke</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
