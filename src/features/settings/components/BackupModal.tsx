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
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { encryptVault, exportToCsv } from '../services/backup-crypto';
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

      await new Promise((r) => setTimeout(r, 200));
      setProgress(30);
      setProgressStatus('Compiling notes, mail, and 2FA collections...');

      const vaultData = await settingsService.exportVaultData();

      await new Promise((r) => setTimeout(r, 200));
      setProgress(60);

      let fileContent = '';
      let mimeType = 'application/json';

      if (format === 'ovault') {
        setProgressStatus(
          passphrase.trim()
            ? 'Encrypting bundle with AES-256-GCM...'
            : 'Packaging secure OneVault bundle...'
        );
        fileContent = await encryptVault(vaultData, passphrase);
        mimeType = 'application/octet-stream';
      } else if (format === 'csv') {
        setProgressStatus('Formatting tabular CSV sections...');
        fileContent = exportToCsv(vaultData);
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        setProgressStatus('Serializing portable JSON archive...');
        fileContent = JSON.stringify(vaultData, null, 2);
        mimeType = 'application/json';
      }

      await new Promise((r) => setTimeout(r, 250));
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

      // Auto close after 2.5s as requested by user
      setTimeout(() => {
        onClose();
      }, 2500);
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
                  <span>Generating Backup...</span>
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
      <div className="space-y-4">
        {/* Item count breakdown summary */}
        <div className="rounded-xl bg-surface border border-default p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-primary">
              Data Included in Backup
            </span>
            <span className="font-mono text-xs font-bold text-accent">
              {stats?.total ?? 0} total records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle">
              <NotePencil size={15} className="text-purple-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-fg-muted uppercase">Notes</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.notes ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle">
              <FolderSimple size={15} className="text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-fg-muted uppercase">Folders</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.noteFolders ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle">
              <Key size={15} className="text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-fg-muted uppercase">2FA Tokens</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.twoFactorTokens ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle">
              <EnvelopeSimple size={15} className="text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-fg-muted uppercase">Mailboxes</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.mailAccounts ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle">
              <ChatText size={15} className="text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-fg-muted uppercase">Inbound Mail</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.mailMessages ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-elevated/50 border border-subtle">
              <ShieldCheck size={15} className="text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-fg-muted uppercase">Domains</div>
                <div className="text-xs font-mono font-semibold text-fg-primary">
                  {stats?.mailSubdomains ?? 0}
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
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'ovault'
                  ? 'border-accent bg-accent-muted/40 shadow-xs'
                  : 'border-default bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-accent">.ovault</span>
                <ShieldCheck size={16} className="text-accent" weight="fill" />
              </div>
              <div className="text-[11px] font-medium text-fg-primary">Encrypted Vault</div>
              <div className="text-[10px] text-fg-muted mt-0.5">AES-256 Secured</div>
            </button>

            {/* .json */}
            <button
              type="button"
              onClick={() => setFormat('json')}
              disabled={isProcessing}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'json'
                  ? 'border-accent bg-accent-muted/40 shadow-xs'
                  : 'border-default bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-fg-primary">.json</span>
                <FileCode size={16} className="text-fg-secondary" />
              </div>
              <div className="text-[11px] font-medium text-fg-primary">Portable JSON</div>
              <div className="text-[10px] text-fg-muted mt-0.5">Raw JSON Archive</div>
            </button>

            {/* .csv */}
            <button
              type="button"
              onClick={() => setFormat('csv')}
              disabled={isProcessing}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                format === 'csv'
                  ? 'border-accent bg-accent-muted/40 shadow-xs'
                  : 'border-default bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-fg-primary">.csv</span>
                <FileCsv size={16} className="text-fg-secondary" />
              </div>
              <div className="text-[11px] font-medium text-fg-primary">Tabular CSV</div>
              <div className="text-[10px] text-fg-muted mt-0.5">Spreadsheet Data</div>
            </button>
          </div>
        </div>

        {/* Optional Passphrase for .ovault */}
        {format === 'ovault' && (
          <div className="space-y-1.5 rounded-lg bg-surface border border-subtle p-3">
            <label className="block text-xs font-medium text-fg-primary flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LockKey size={14} className="text-accent" />
                <span>Encryption Passphrase</span>
              </span>
              <span className="text-[10px] font-mono text-fg-muted">(optional)</span>
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={isProcessing}
              placeholder="Enter passphrase to encrypt with AES-GCM 256-bit"
              className="w-full px-3 py-1.5 rounded-lg bg-elevated border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono"
            />
            <p className="text-[10px] text-fg-muted font-mono">
              If set, this password will be required when restoring or importing this file.
            </p>
          </div>
        )}

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
          <p className="text-[10px] text-fg-muted font-mono">
            Default naming includes domain and timestamp.
          </p>
        </div>

        {/* Progress & Status Bar */}
        {isProcessing && (
          <div className="space-y-2 pt-2 border-t border-subtle">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-fg-secondary flex items-center gap-2">
                {!isDone ? (
                  <CircleNotch size={14} className="animate-spin text-accent" />
                ) : (
                  <CheckCircle size={15} className="text-emerald-500" weight="fill" />
                )}
                <span>{progressStatus}</span>
              </span>
              <span className="font-mono font-semibold text-fg-primary">{progress}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-elevated overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isDone ? 'bg-emerald-500' : 'bg-accent'
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
