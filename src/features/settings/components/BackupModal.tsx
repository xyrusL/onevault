import React, { useEffect, useState } from 'react';
import {
  CloudArrowDown,
  ShieldCheck,
  FileCode,
  FileCsv,
  LockKey,
  CheckCircle,
  CircleNotch,
  FolderSimple,
  NotePencil,
  EnvelopeSimple,
  ChatText,
  Key,
  Globe,
  Fingerprint,
  Database,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { CustomCheckbox } from '../../../shared/components/forms';
import {
  encryptVault,
  encryptVaultToJson,
  encryptVaultToCsv,
  exportToCsv,
} from '../services/backup-crypto';
import { settingsService } from '../services/settings.service';
import type { BackupFormat, VaultStats } from '../types/settings.types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: VaultStats | null;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [format, setFormat] = useState<BackupFormat>('ovault');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [filename, setFilename] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or update default filename when modal opens or format changes
  useEffect(() => {
    if (isOpen) {
      const host = window.location.hostname || 'onevault';
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setFilename(`${host}-${yyyy}-${mm}-${dd}-${hh}${min}.${format}`);
      setIsProcessing(false);
      setProgress(0);
      setIsDone(false);
      setErrorMsg(null);
    }
  }, [isOpen, format]);

  const handleStartBackup = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setProgress(10);
      setProgressStatus('Initiating vault snapshot...');

      await new Promise((r) => setTimeout(r, 150));
      setProgress(30);
      setProgressStatus('Exporting collections from D1 (1 request)...');

      const vaultData = await settingsService.exportVaultData();

      await new Promise((r) => setTimeout(r, 150));
      setProgress(60);

      let fileContent = '';
      let mimeType = 'application/json';

      if (format === 'ovault') {
        setProgressStatus(
          passphrase.trim()
            ? 'Encrypting .ovault with AES-256-GCM (Custom Password)...'
            : 'Encrypting .ovault with AES-256-GCM (OneVault Site Key)...'
        );
        fileContent = await encryptVault(vaultData, passphrase, 'ovault');
        mimeType = 'application/octet-stream';
      } else if (format === 'csv') {
        if (isEncrypted) {
          setProgressStatus(
            passphrase.trim()
              ? 'Encrypting CSV with AES-256-GCM (Custom Password)...'
              : 'Encrypting CSV with AES-256-GCM (OneVault Site Key)...'
          );
          fileContent = await encryptVaultToCsv(vaultData, passphrase);
        } else {
          setProgressStatus('Formatting unencrypted plain CSV on device (0 quota)...');
          fileContent = exportToCsv(vaultData);
        }
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        if (isEncrypted) {
          setProgressStatus(
            passphrase.trim()
              ? 'Encrypting JSON with AES-256-GCM (Custom Password)...'
              : 'Encrypting JSON with AES-256-GCM (OneVault Site Key)...'
          );
          fileContent = await encryptVaultToJson(vaultData, passphrase);
        } else {
          setProgressStatus('Serializing unencrypted plain JSON on device (0 quota)...');
          fileContent = JSON.stringify(vaultData, null, 2);
        }
        mimeType = 'application/json';
      }

      await new Promise((r) => setTimeout(r, 200));
      setProgress(90);
      setProgressStatus('Finalizing archive package...');

      // Trigger browser download
      const blob = new Blob([fileContent], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || `onevault-backup.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setProgress(100);
      setProgressStatus('Backup downloaded successfully!');
      setIsDone(true);

      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate vault backup.');
      setIsProcessing(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title="Create Vault Backup"
      subtitle="Export a secure, encrypted copy of your entire OneVault system"
      icon={<CloudArrowDown size={18} className="text-accent" weight="duotone" />}
      maxWidthClass="max-w-lg"
      footer={
        !isDone ? (
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs text-fg-secondary hover:text-fg-primary rounded-lg hover:bg-elevated transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartBackup}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <CircleNotch size={14} className="animate-spin" />
                  <span>Processing ({progress}%)...</span>
                </>
              ) : (
                <>
                  <CloudArrowDown size={15} weight="bold" />
                  <span>Begin Backup</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              Auto-closing in a moment...
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto pr-1">
        {/* Item count breakdown summary */}
        <div className="rounded-xl bg-surface border border-default p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-primary">
              Collections Included in Backup
            </span>
            <span className="font-mono text-xs font-bold text-accent">
              {stats?.total ?? 0} total records
            </span>
          </div>

          {/* Responsive Collection Pill Grid (8 collections cleanly filling 4 columns / 2 rows) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <NotePencil size={15} className="text-purple-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Notes</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.notes ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <FolderSimple size={15} className="text-blue-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Folders</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.noteFolders ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <Key size={15} className="text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">2FA Tokens</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.twoFactorTokens ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <Fingerprint size={15} className="text-rose-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Passkeys</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.passkeys ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <EnvelopeSimple size={15} className="text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Mailboxes</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.mailAccounts ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <ChatText size={15} className="text-cyan-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Inbound Mail</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.mailMessages ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <Globe size={15} className="text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Domains</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {(stats?.customDomains ?? 0) + (stats?.mailSubdomains ?? 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle min-w-0">
              <Database size={15} className="text-sky-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-fg-muted uppercase truncate">DNS Records</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.domainDnsRecords ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Format Selection (3 formats) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-fg-primary">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* .ovault */}
            <button
              type="button"
              onClick={() => setFormat('ovault')}
              disabled={isProcessing}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'ovault'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-default bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <ShieldCheck
                  size={18}
                  weight="duotone"
                  className={format === 'ovault' ? 'text-accent' : 'text-fg-muted'}
                />
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                  AES-256
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-fg-primary">.ovault</div>
                <div className="text-[10px] text-fg-muted line-clamp-1">Encrypted Vault</div>
              </div>
            </button>

            {/* .json */}
            <button
              type="button"
              onClick={() => setFormat('json')}
              disabled={isProcessing}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'json'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-default bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <FileCode
                  size={18}
                  weight="duotone"
                  className={format === 'json' ? 'text-accent' : 'text-fg-muted'}
                />
                {isEncrypted && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                    AES-256
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-fg-primary">.json</div>
                <div className="text-[10px] text-fg-muted line-clamp-1">
                  {isEncrypted ? 'Encrypted JSON' : 'Plain JSON'}
                </div>
              </div>
            </button>

            {/* .csv */}
            <button
              type="button"
              onClick={() => setFormat('csv')}
              disabled={isProcessing}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'csv'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-default bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <FileCsv
                  size={18}
                  weight="duotone"
                  className={format === 'csv' ? 'text-accent' : 'text-fg-muted'}
                />
                {isEncrypted && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                    AES-256
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-fg-primary">.csv</div>
                <div className="text-[10px] text-fg-muted line-clamp-1">
                  {isEncrypted ? 'Encrypted CSV' : 'Plain CSV'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Universal Encryption Controls (Applies to all formats) */}
        <div className="space-y-2 p-3 rounded-xl bg-surface border border-accent/25">
          <div className="flex items-center justify-between text-xs font-semibold text-fg-primary">
            <div className="flex items-center gap-1.5">
              <LockKey size={14} className="text-accent" />
              <span>AES-256-GCM Encryption</span>
            </div>
            {format !== 'ovault' ? (
              <CustomCheckbox
                checked={isEncrypted}
                onChange={setIsEncrypted}
                disabled={isProcessing}
                label="Encrypted Export"
              />
            ) : (
              <span className="text-[10px] font-mono text-accent bg-accent/15 px-2 py-0.5 rounded-full font-bold">
                ALWAYS ON
              </span>
            )}
          </div>

          {(isEncrypted || format === 'ovault') ? (
            <>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-fg-secondary font-medium">Password (Optional)</span>
                <span className="text-[9px] font-mono text-accent bg-accent/15 px-1.5 py-0.5 rounded font-bold">
                  {passphrase.trim() ? 'CUSTOM PASSWORD' : 'ONEVAULT SITE KEY'}
                </span>
              </div>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                disabled={isProcessing}
                placeholder="Enter passphrase (or leave blank to auto-lock with OneVault Site Key)"
                className="w-full px-3 py-1.5 rounded-lg bg-elevated border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono"
              />
              <p className="text-[10px] text-fg-muted font-mono leading-relaxed">
                {passphrase.trim()
                  ? '🔒 Encrypted with your private passphrase. You will need this password to import.'
                  : '🛡️ Encrypted with OneVault Site Key. The exported file will be unreadable ciphertext to outside software, and only OneVault can unlock it.'}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-amber-500 font-mono leading-relaxed pt-1">
              ⚠️ Exporting unencrypted plaintext. Anyone who opens the file will be able to read all records in plain text.
            </p>
          )}
        </div>

        {/* File name input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-fg-primary">
            Archive Filename
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            disabled={isProcessing}
            placeholder="domain-YYYY-MM-DD-HHmm.ext"
            className="w-full px-3 py-1.5 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono"
          />
        </div>

        {/* Live Processing Progress GUI */}
        {isProcessing && (
          <div className="space-y-2 p-3 rounded-xl bg-surface border border-default animate-portal-view">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-fg-secondary flex items-center gap-2 min-w-0 truncate">
                {!isDone ? (
                  <CircleNotch size={14} className="animate-spin text-accent shrink-0" />
                ) : (
                  <CheckCircle size={15} className="text-emerald-500 shrink-0" weight="fill" />
                )}
                <span className="truncate">{progressStatus}</span>
              </span>
              <span className="font-mono font-bold text-accent shrink-0 px-2 py-0.5 rounded-full bg-accent-muted text-[11px]">
                {progress}%
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-elevated overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-accent to-emerald-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-mono">
            {errorMsg}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
