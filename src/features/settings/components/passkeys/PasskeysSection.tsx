import React, { useEffect, useState } from 'react';
import {
  Fingerprint,
  Plus,
  ShieldCheck,
  CircleNotch,
  WarningCircle,
  CheckCircle,
  Key,
} from '@phosphor-icons/react';
import { passkeyService } from '../../services/passkey.service';
import { GeneratePasskeyModal } from './GeneratePasskeyModal';
import { PasskeyCardItem } from './PasskeyCardItem';
import type { PasskeyItem } from '../../types/passkey.types';

export const PasskeysSection: React.FC = () => {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSupported = passkeyService.isSupported();

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const items = await passkeyService.listPasskeys();
      setPasskeys(items);
    } catch (err: any) {
      console.error('Failed to load passkeys:', err);
      setErrorMsg(err.message || 'Failed to retrieve registered passkeys.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreated = (newPasskey: PasskeyItem) => {
    setPasskeys((prev) => [newPasskey, ...prev.filter((p) => p.id !== newPasskey.id)]);
    setSuccessMsg(`Passkey "${newPasskey.name}" registered successfully.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleDelete = async (credentialId: string) => {
    try {
      await passkeyService.deletePasskey(credentialId);
      setPasskeys((prev) => prev.filter((p) => p.id !== credentialId));
      setSuccessMsg('Passkey access revoked successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to revoke passkey:', err);
      setErrorMsg(err.message || 'Failed to revoke passkey access.');
      throw err;
    }
  };

  return (
    <div className="rounded-xl bg-surface-solid border border-default p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-fg-primary flex items-center gap-2">
            <Fingerprint size={18} className="text-accent" weight="bold" />
            <span>Passkeys &amp; Passwordless Sign-In</span>
          </h3>
          <p className="font-mono text-xs text-fg-secondary mt-0.5">
            Authenticate using Windows Hello, Face ID, Touch ID, or security keys.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={!isSupported}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto shrink-0"
        >
          <Plus size={14} weight="bold" />
          <span>Generate Passkey</span>
        </button>
      </div>

      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-600 dark:text-amber-400 font-mono">
          <WarningCircle size={17} weight="fill" className="shrink-0 mt-0.5" />
          <div>
            WebAuthn is not supported in this browser environment. Please use an HTTPS connection
            and a modern browser (Chrome, Safari, Edge, Firefox).
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-600 dark:text-red-400 font-mono">
          <WarningCircle size={17} weight="fill" className="shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
          <CheckCircle size={17} weight="fill" className="shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {/* Passkey List / Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-fg-secondary text-xs font-mono gap-2">
          <CircleNotch size={16} className="animate-spin text-accent" />
          <span>Loading registered passkeys...</span>
        </div>
      ) : passkeys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-default p-6 text-center space-y-3 bg-surface/50">
          <div className="flex h-11 w-11 mx-auto items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
            <Key size={22} weight="duotone" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-display text-sm font-semibold text-fg-primary">
              No Passkeys Configured Yet
            </h4>
            <p className="font-mono text-xs text-fg-secondary">
              Generate a passkey to enable 1-click biometric sign-in from your laptop, mobile phone, or hardware security key without typing your master password.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!isSupported}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-elevated hover:bg-surface border border-default text-xs font-semibold text-fg-primary transition-colors cursor-pointer"
            >
              <Fingerprint size={15} weight="bold" className="text-accent" />
              <span>Generate Your First Passkey</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {passkeys.map((passkey) => (
            <PasskeyCardItem key={passkey.id} passkey={passkey} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Footer / Tip */}
      <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-fg-muted border-t border-subtle">
        <ShieldCheck size={14} className="text-emerald-500 shrink-0" weight="fill" />
        <span>
          Passkeys use FIDO2 public-key cryptography. You can revoke device access anytime.
        </span>
      </div>

      {/* Generate Passkey Modal */}
      <GeneratePasskeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
};
