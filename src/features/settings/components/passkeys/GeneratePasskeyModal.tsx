import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  DeviceMobile,
  ShieldCheck,
  CircleNotch,
  WarningCircle,
  CheckCircle,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import { passkeyService } from '../../services/passkey.service';
import { getDefaultDeviceName } from '../../utils/device-detection.utils';
import type { PasskeyItem } from '../../types/passkey.types';

interface GeneratePasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPasskey: PasskeyItem) => void;
}

export const GeneratePasskeyModal: React.FC<GeneratePasskeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passkeyName, setPasskeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasskeyName(getDefaultDeviceName());
      setErrorMsg(null);
      setIsSuccess(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyName.trim()) {
      setErrorMsg('Please specify a device or passkey name.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const created = await passkeyService.registerPasskey(passkeyName.trim());
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(created);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Passkey creation error:', err);
      // Clean up common WebAuthn user-cancelled errors
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Passkey creation was canceled by user or timed out.');
      } else {
        setErrorMsg(err.message || 'Failed to create passkey. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title="Generate Passkey"
      subtitle="FIDO2 / WebAuthn biometric or security key login"
      icon={<Fingerprint size={18} weight="duotone" className="text-accent" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleGenerate} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
            <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">{errorMsg}</div>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">
              Passkey generated and enrolled successfully!
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-fg-primary">
            Device or Passkey Label
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted">
              <DeviceMobile size={16} />
            </div>
            <input
              type="text"
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              placeholder="e.g. MacBook Pro, Windows PC, iPhone 15"
              required
              disabled={isLoading || isSuccess}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors font-mono disabled:opacity-60"
            />
          </div>
          <p className="text-[11px] text-fg-muted font-mono">
            This name helps you identify which device or key was used.
          </p>
        </div>

        {/* Informational Guidance Box */}
        <div className="rounded-lg bg-elevated/50 border border-default p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-fg-primary font-semibold text-xs font-display">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" weight="fill" />
            <span>How it works</span>
          </div>
          <p className="text-fg-secondary leading-relaxed text-[11px]">
            Your browser or device will prompt you to verify your identity using{' '}
            <strong className="text-fg-primary">Windows Hello, Touch ID, Face ID</strong>, or a{' '}
            <strong className="text-fg-primary">hardware security key (YubiKey)</strong>.
          </p>
          <p className="text-fg-muted leading-relaxed text-[11px] font-mono">
            Private biometric keys remain locked on your device hardware and are never transmitted to OneVault.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || isSuccess}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-fg-secondary hover:text-fg-primary hover:bg-elevated transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isSuccess || !passkeyName.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                <span>Waiting for authenticator...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle size={14} weight="bold" />
                <span>Verified!</span>
              </>
            ) : (
              <>
                <Fingerprint size={15} weight="bold" />
                <span>Create Passkey</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
