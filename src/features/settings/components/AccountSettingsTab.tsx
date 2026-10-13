import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Key,
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  CheckCircle,
  WarningCircle,
  Clock,
  UserGear,
  CircleNotch,
  CloudArrowDown,
  LockSimple,
  Database,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { settingsService } from '../services/settings.service';
import { authService } from '../../auth';
import type { AdminAccount } from '../types/settings.types';
import { PasskeysSection } from './passkeys';

interface AccountSettingsTabProps {
  onNavigateToBackup?: () => void;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  onNavigateToBackup,
}) => {
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await settingsService.getAccount();
      setAccount(data);
      setNewEmail(data.email);

      // Synchronize local session if it held an older email
      const currentSession = authService.getSession();
      if (currentSession && currentSession.email !== data.email) {
        authService.saveSession({
          ...currentSession,
          email: data.email,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load administrator account profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Current password is required to verify and authorize changes.');
      return;
    }

    const emailChanged = newEmail.trim() !== '' && newEmail.trim().toLowerCase() !== account?.email.toLowerCase();
    const passwordChanged = newPassword.trim() !== '';

    if (!emailChanged && !passwordChanged) {
      setErrorMsg('Please specify a new email or password to update.');
      return;
    }

    if (passwordChanged) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation password do not match.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await settingsService.updateAccount({
        currentPassword,
        newEmail: emailChanged ? newEmail.trim() : undefined,
        newPassword: passwordChanged ? newPassword : undefined,
      });

      setSuccessMsg(res.message || 'Account credentials successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (res.email) {
        setAccount((prev) => (prev ? { ...prev, email: res.email } : null));
        setNewEmail(res.email);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update account credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Main Column (Account ID & Update Credentials) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Account Identity Card */}
          <div className="rounded-xl bg-surface-solid border border-default p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
                  <UserGear size={26} weight="duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-fg-primary">
                      {isLoading ? 'Loading profile...' : account?.email}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-accent-muted text-accent border border-accent/20">
                      {account?.role || 'Admin'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-fg-secondary mt-0.5 flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>
                      Active account since{' '}
                      {account?.createdAt
                        ? new Date(account.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'System Init'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto bg-surface px-3 py-1.5 rounded-lg border border-subtle">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" weight="fill" />
                <span className="text-xs font-mono text-fg-secondary">SHA-256 HMAC &amp; JWT Verified</span>
              </div>
            </div>
          </div>

          {/* Update Credentials Form Card */}
          <div className="rounded-xl bg-surface-solid border border-default p-5 sm:p-6 shadow-xs">
            <div className="border-b border-subtle pb-4 mb-5">
              <h3 className="font-display text-sm font-semibold text-fg-primary flex items-center gap-2">
                <Key size={16} className="text-accent" weight="bold" />
                <span>Update Account Credentials</span>
              </h3>
              <p className="font-mono text-xs text-fg-secondary mt-0.5">
                Change your administrator login email address or update your master password.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-600 dark:text-red-400">
                <WarningCircle size={17} weight="fill" className="shrink-0 mt-0.5" />
                <div className="flex-1 font-mono">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={17} weight="fill" className="shrink-0 mt-0.5" />
                <div className="flex-1 font-mono">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Email Update Section */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-fg-primary">
                  Administrator Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted">
                    <EnvelopeSimple size={16} />
                  </div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors font-mono"
                  />
                </div>
                <p className="text-[11px] text-fg-muted font-mono">
                  Used to sign in to OneVault and authorize access to all vault data.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-subtle">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-fg-primary">
                    New Password <span className="font-normal text-fg-muted">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted">
                      <LockKey size={16} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-fg-muted hover:text-fg-primary cursor-pointer"
                    >
                      {showNewPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-fg-muted font-mono">
                    Leave blank if you only want to change your email address.
                  </p>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-fg-primary">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted">
                      <LockKey size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      disabled={!newPassword}
                      className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors font-mono disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-fg-muted hover:text-fg-primary cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification section: Current Password */}
              <div className="pt-3 border-t border-subtle">
                <div className="rounded-lg bg-elevated/60 border border-default p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-fg-primary">
                      Current Master Password <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-fg-muted">Identity verification</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted">
                      <ShieldCheck size={16} />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Type current password to confirm authorization"
                      required
                      autoComplete="current-password"
                      className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-fg-muted hover:text-fg-primary cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving || !currentPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <CircleNotch size={14} className="animate-spin" />
                      <span>Verifying &amp; Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} weight="bold" />
                      <span>Save Account Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Passkeys & Passwordless Sign-In Section */}
          <PasskeysSection />
        </div>

        {/* Right Column (Security Posture, Audit & Recommendations) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Backup Advisory Card */}
          <div className="rounded-xl bg-surface-solid border border-default p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-accent font-semibold text-xs font-display">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted border border-accent/20">
                <CloudArrowDown size={16} weight="duotone" />
              </div>
              <span>Backup Recommendation</span>
            </div>
            <p className="text-xs text-fg-secondary leading-relaxed">
              Before updating your master administrator email or password, ensure you have exported a current backup of your database.
            </p>
            {onNavigateToBackup && (
              <button
                type="button"
                onClick={onNavigateToBackup}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-accent hover:text-accent/80 transition-colors cursor-pointer pt-1"
              >
                <span>Go to Backup &amp; Migration</span>
                <ArrowSquareOut size={13} />
              </button>
            )}
          </div>

          {/* Security Safeguards Overview */}
          <div className="rounded-xl bg-surface-solid border border-default p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-fg-primary font-semibold text-xs font-display">
              <LockSimple size={16} className="text-emerald-500" weight="fill" />
              <span>Security Safeguards</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <div className="text-fg-primary font-semibold">FIDO2 Passkeys Verification</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">
                    Hardware-bound public-key biometrics defend against phishing.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <div className="text-fg-primary font-semibold">Constant-Time Verification</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">
                    SubtleCrypto HMAC comparison prevents timing attacks.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <div className="text-fg-primary font-semibold">Session Token Rotation</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">
                    Signed JWT bearer sessions expire after 7 days of inactivity.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <div className="text-fg-primary font-semibold">SQL Injection Defense</div>
                  <div className="text-[11px] text-fg-muted mt-0.5">
                    Parameterized Cloudflare D1 queries across all operations.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Infrastructure Card */}
          <div className="rounded-xl bg-surface-solid border border-default p-5 shadow-xs space-y-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-fg-primary font-semibold font-display">
              <Database size={15} className="text-accent" />
              <span>Database Binding</span>
            </div>
            <div className="flex justify-between items-center text-fg-secondary">
              <span>Primary Engine</span>
              <span className="text-fg-primary font-semibold">Cloudflare D1</span>
            </div>
            <div className="flex justify-between items-center text-fg-secondary">
              <span>Storage Namespace</span>
              <span className="text-accent font-semibold">onevault-storage</span>
            </div>
            <div className="flex justify-between items-center text-fg-secondary">
              <span>Deployment Mode</span>
              <span className="text-emerald-500 font-semibold">Edge Distributed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
