import React, { useEffect, useState } from 'react';
import {
  CloudArrowDown,
  CloudArrowUp,
  ShieldCheck,
  NotePencil,
  Key,
  EnvelopeSimple,
  ChatText,
  ArrowsClockwise,
  CheckCircle,
  Globe,
  Fingerprint,
} from '@phosphor-icons/react';
import { settingsService } from '../services/settings.service';
import type { VaultStats } from '../types/settings.types';
import { BackupModal } from './BackupModal';
import { ImportModal } from './ImportModal';

export const BackupImportTab: React.FC = () => {
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getVaultStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load vault statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Visual Hero Banner with Vault Background Image */}
      <div className="relative rounded-2xl overflow-hidden border border-default shadow-card min-h-[170px] sm:min-h-[190px] flex items-center bg-surface-solid">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-40 filter contrast-125 transition-opacity"
          style={{ backgroundImage: `url('/images/vault-bg.jpg')` }}
        />
        {/* Gradient Overlay for high readability in both light & dark themes */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface-solid via-surface-solid/85 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-accent-muted text-accent border border-accent/20">
              <ShieldCheck size={13} weight="fill" />
              <span>Enterprise Vault Storage Engine</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg-primary">
              Data Backup &amp; Disaster Recovery
            </h2>
            <p className="font-mono text-xs text-fg-secondary">
              Zero-knowledge portable exports and timestamp-synchronized restores for all your OneVault assets.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-surface/90 border border-default backdrop-blur-md shadow-xs text-right">
              <div className="text-[10px] font-mono text-fg-muted uppercase">Total Vault Records</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-accent">
                {isLoading ? '...' : (stats?.total ?? 0)}
              </div>
            </div>
            <button
              type="button"
              onClick={loadStats}
              title="Refresh statistics"
              className="p-1.5 rounded-lg bg-surface/80 hover:bg-elevated border border-subtle text-fg-secondary hover:text-fg-primary cursor-pointer transition-colors"
            >
              <ArrowsClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Storage Inventory Pill Grid (Responsive Mobile 2-col, Tablet 3-col, Desktop 6-col) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-xl bg-surface-solid border border-default shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <NotePencil size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Notes &amp; Folders</div>
            <div className="text-sm font-bold font-mono text-fg-primary">
              {(stats?.notes ?? 0) + (stats?.noteFolders ?? 0)}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-solid border border-default shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Key size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-fg-muted uppercase truncate">2FA Tokens</div>
            <div className="text-sm font-bold font-mono text-fg-primary">
              {stats?.twoFactorTokens ?? 0}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-solid border border-default shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <EnvelopeSimple size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Mail Accounts</div>
            <div className="text-sm font-bold font-mono text-fg-primary">
              {stats?.mailAccounts ?? 0}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-solid border border-default shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <ChatText size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Inbound Mail</div>
            <div className="text-sm font-bold font-mono text-fg-primary">
              {stats?.mailMessages ?? 0}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-solid border border-default shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Globe size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Domains &amp; DNS</div>
            <div className="text-sm font-bold font-mono text-fg-primary">
              {(stats?.customDomains ?? 0) + (stats?.domainDnsRecords ?? 0) + (stats?.mailSubdomains ?? 0)}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-solid border border-default shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Fingerprint size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-fg-muted uppercase truncate">Passkeys</div>
            <div className="text-sm font-bold font-mono text-fg-primary">
              {stats?.passkeys ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Two Action Cards: Backup and Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Backup / Export */}
        <div className="rounded-2xl bg-surface-solid border border-default p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-accent/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
                <CloudArrowDown size={24} weight="duotone" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-surface border border-subtle text-fg-secondary">
                3 Formats
              </span>
            </div>

            <div>
              <h3 className="font-display text-base font-semibold text-fg-primary">
                Export &amp; Backup Vault
              </h3>
              <p className="font-mono text-xs text-fg-secondary mt-1">
                Download a complete, offline archive of your OneVault database to your local machine.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-subtle text-xs font-mono text-fg-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-accent shrink-0" weight="fill" />
                <span>AES-256 client-side encrypted bundle (.ovault)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-accent shrink-0" weight="fill" />
                <span>Standard JSON and tabular CSV export options</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-accent shrink-0" weight="fill" />
                <span>Automatic timestamped naming format</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer"
            >
              <CloudArrowDown size={16} weight="bold" />
              <span>Create Backup Archive</span>
            </button>
          </div>
        </div>

        {/* Card 2: Import / Restore */}
        <div className="rounded-2xl bg-surface-solid border border-default p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-accent/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
                <CloudArrowUp size={24} weight="duotone" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Smart Merge
              </span>
            </div>

            <div>
              <h3 className="font-display text-base font-semibold text-fg-primary">
                Import &amp; Restore Vault
              </h3>
              <p className="font-mono text-xs text-fg-secondary mt-1">
                Restore or merge backup packages (.ovault, .json, .csv) with intelligent collision resolution.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-subtle text-xs font-mono text-fg-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />
                <span>Drag &amp; drop, remote URL, or direct text paste</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />
                <span>Automatic pre-import structure validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />
                <span>Add new, update newer timestamps, skip duplicates</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-elevated border border-default text-xs font-semibold text-fg-primary transition-all shadow-xs cursor-pointer"
            >
              <CloudArrowUp size={16} weight="bold" />
              <span>Import &amp; Restore Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        stats={stats}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={loadStats}
      />
    </div>
  );
};
