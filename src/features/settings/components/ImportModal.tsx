import React, { useRef, useState } from 'react';
import {
  CloudArrowUp,
  UploadSimple,
  Link,
  CodeBlock,
  LockKey,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  PlusCircle,
  ArrowsClockwise,
  MinusCircle,
  NotePencil,
  FolderSimple,
  Key,
  EnvelopeSimple,
  ChatText,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { decryptVault, validateVaultStructure } from '../services/backup-crypto';
import { settingsService } from '../services/settings.service';
import type { ImportSummary, VaultExportData } from '../types/settings.types';

type ImportInputMode = 'upload' | 'url' | 'raw';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [mode, setMode] = useState<ImportInputMode>('upload');
  const [rawText, setRawText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isEncryptedBundle, setIsEncryptedBundle] = useState(false);

  // Validation & Processing state
  const [parsedData, setParsedData] = useState<VaultExportData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setRawText('');
    setUrlInput('');
    setFileName('');
    setPassphrase('');
    setIsEncryptedBundle(false);
    setParsedData(null);
    setIsValidating(false);
    setIsImporting(false);
    setImportProgress(0);
    setProgressStatus('');
    setImportResult(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  // Inspect raw payload to check for encryption and structure
  const inspectAndValidate = async (content: string, customPassphrase?: string) => {
    setErrorMsg(null);
    setIsValidating(true);
    try {
      const trimmed = content.trim();

      // Check if encrypted .ovault container
      let isEncrypted = false;
      try {
        const json = JSON.parse(trimmed);
        if (json.encrypted === true) {
          isEncrypted = true;
          setIsEncryptedBundle(true);
        }
      } catch {
        // Not a JSON object, might be CSV or plaintext
      }

      const pass = customPassphrase ?? passphrase;
      if (isEncrypted && !pass.trim()) {
        setIsEncryptedBundle(true);
        setIsValidating(false);
        return; // Wait for user to input passphrase
      }

      const decrypted = await decryptVault(content, pass);
      const validated = validateVaultStructure(decrypted);
      setParsedData(validated);
    } catch (err: any) {
      setParsedData(null);
      setErrorMsg(err.message || 'Invalid vault archive structure.');
    } finally {
      setIsValidating(false);
    }
  };

  // 1. File Upload / Drag & Drop
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      await inspectAndValidate(text);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 2. Fetch URL
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setErrorMsg(null);
    setIsValidating(true);
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: Failed to fetch file.`);
      const text = await res.text();
      setRawText(text);
      setFileName(urlInput.split('/').pop() || 'remote-vault-backup');
      await inspectAndValidate(text);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch vault backup from URL.');
      setIsValidating(false);
    }
  };

  // 3. Raw Text Change
  const handleRawTextChange = async (text: string) => {
    setRawText(text);
    setFileName('pasted-archive.json');
    if (text.trim().length > 10) {
      await inspectAndValidate(text);
    } else {
      setParsedData(null);
    }
  };

  // Re-run validation when passphrase changes
  const handlePassphraseApply = async () => {
    if (rawText) {
      await inspectAndValidate(rawText, passphrase);
    }
  };

  // Execute smart merge
  const handleBeginImport = async () => {
    if (!parsedData) return;
    try {
      setIsImporting(true);
      setErrorMsg(null);
      setImportProgress(15);
      setProgressStatus('Analyzing database records & matching IDs...');

      await new Promise((r) => setTimeout(r, 250));
      setImportProgress(40);
      setProgressStatus('Comparing updated timestamps for existing items...');

      await new Promise((r) => setTimeout(r, 200));
      setImportProgress(65);
      setProgressStatus('Inserting new records & updating modified entries...');

      const summary = await settingsService.importVaultData(parsedData);

      await new Promise((r) => setTimeout(r, 200));
      setImportProgress(100);
      setProgressStatus('Smart synchronization complete!');
      setImportResult(summary);
      onImportComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Import operation encountered an error.');
      setIsImporting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import &amp; Restore Vault"
      subtitle="Restore or merge collections with automatic timestamp synchronization"
      icon={<CloudArrowUp size={18} className="text-accent" weight="duotone" />}
      maxWidthClass="max-w-xl"
      footer={
        importResult ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              Vault data synchronized successfully
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 text-xs bg-accent text-accent-fg font-semibold rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : !isImporting ? (
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-fg-secondary hover:text-fg-primary rounded-lg hover:bg-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBeginImport}
              disabled={!parsedData || isValidating}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudArrowUp size={15} weight="bold" />
              <span>Begin Import</span>
            </button>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {/* Phase 1: Input & Verification */}
        {!importResult && !isImporting && (
          <>
            {/* Input method selection tabs */}
            <div className="flex items-center p-1 rounded-lg bg-surface border border-default">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-elevated text-fg-primary shadow-xs font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <UploadSimple size={14} />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'url'
                    ? 'bg-elevated text-fg-primary shadow-xs font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <Link size={14} />
                <span>Paste URL</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('raw')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'raw'
                    ? 'bg-elevated text-fg-primary shadow-xs font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <CodeBlock size={14} />
                <span>Paste JSON/Text</span>
              </button>
            </div>

            {/* Mode 1: Drag & Drop / File Select */}
            {mode === 'upload' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-default hover:border-accent rounded-xl p-6 text-center cursor-pointer transition-colors bg-surface/50 hover:bg-surface flex flex-col items-center justify-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".ovault,.json,.csv,text/plain"
                  className="hidden"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
                  <UploadSimple size={22} weight="duotone" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-fg-primary">
                    {fileName ? (
                      <span className="text-accent font-mono">{fileName}</span>
                    ) : (
                      'Click to upload or drag & drop vault archive'
                    )}
                  </div>
                  <div className="text-[11px] text-fg-muted font-mono mt-0.5">
                    Supports .ovault, .json, and .csv files
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Paste URL */}
            {mode === 'url' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-fg-primary">
                  Vault Archive Download URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/vault-backup.ovault"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={!urlInput.trim() || isValidating}
                    className="px-3 py-1.5 rounded-lg bg-elevated border border-default text-xs font-medium text-fg-primary hover:bg-surface-solid transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Fetch
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Paste Raw JSON / CSV */}
            {mode === 'raw' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-fg-primary">
                  Paste Raw JSON or CSV Content
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder="Paste { ... } or CSV archive payload directly here"
                  className="w-full p-2.5 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono resize-none"
                />
              </div>
            )}

            {/* Encrypted Password Prompt (only when bundle is encrypted) */}
            {isEncryptedBundle && (
              <div className="rounded-xl bg-surface border border-accent/30 p-3.5 space-y-2 animate-portal-view">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                  <LockKey size={16} weight="bold" />
                  <span>Encrypted Archive Detected</span>
                </div>
                <p className="text-[11px] text-fg-secondary font-mono">
                  This backup is protected with AES-256 encryption. Enter the passphrase to unlock and verify:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter decryption password"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-elevated border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handlePassphraseApply}
                    disabled={!passphrase.trim() || isValidating}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Unlock
                  </button>
                </div>
              </div>
            )}

            {/* Structure Validation Status Banner */}
            {isValidating && (
              <div className="flex items-center gap-2 text-xs font-mono text-fg-secondary p-2.5 bg-surface rounded-lg border border-subtle">
                <CircleNotch size={14} className="animate-spin text-accent" />
                <span>Verifying archive structure &amp; collections...</span>
              </div>
            )}

            {parsedData && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={16} weight="fill" />
                    <span>Valid Vault Archive Verified</span>
                  </div>
                  <span className="font-mono text-[11px] text-fg-muted">
                    {parsedData.counts.total} items ready to merge
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center pt-1 font-mono">
                  <div className="p-1.5 rounded-md bg-surface/60 border border-subtle">
                    <div className="text-[10px] text-fg-muted">Notes</div>
                    <div className="text-xs font-bold text-fg-primary">
                      {parsedData.counts.notes}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-md bg-surface/60 border border-subtle">
                    <div className="text-[10px] text-fg-muted">Folders</div>
                    <div className="text-xs font-bold text-fg-primary">
                      {parsedData.counts.noteFolders}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-md bg-surface/60 border border-subtle">
                    <div className="text-[10px] text-fg-muted">2FA</div>
                    <div className="text-xs font-bold text-fg-primary">
                      {parsedData.counts.twoFactorTokens}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-md bg-surface/60 border border-subtle">
                    <div className="text-[10px] text-fg-muted">Mail</div>
                    <div className="text-xs font-bold text-fg-primary">
                      {parsedData.counts.mailAccounts}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-md bg-surface/60 border border-subtle">
                    <div className="text-[10px] text-fg-muted">Msgs</div>
                    <div className="text-xs font-bold text-fg-primary">
                      {parsedData.counts.mailMessages}
                    </div>
                  </div>
                </div>

                {/* Smart Merge Legend */}
                <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted pt-1 border-t border-emerald-500/20">
                  <span>Smart Merge Engine:</span>
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-500 font-semibold">+ Add new</span>
                    <span className="text-blue-500 font-semibold">↻ Sync updated</span>
                    <span className="text-fg-muted font-semibold">⊘ Skip duplicates</span>
                  </span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-mono flex items-start gap-2">
                <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </>
        )}

        {/* Phase 2: Processing Live Progress */}
        {isImporting && !importResult && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted border border-accent/20 text-accent animate-pulse">
                <ArrowsClockwise size={28} className="animate-spin" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-fg-primary">
                  Processing &amp; Synchronizing Vault Data
                </h3>
                <p className="font-mono text-xs text-fg-secondary mt-1">
                  {progressStatus}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-fg-muted">Sync Progress</span>
                <span className="font-semibold text-fg-primary">{importProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Completion Results Breakdown Screen */}
        {importResult && (
          <div className="space-y-4 animate-portal-view">
            {/* Header badge */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={24} className="text-emerald-500 shrink-0" weight="fill" />
              <div>
                <h3 className="font-display text-sm font-semibold text-fg-primary">
                  Vault Synchronization Complete
                </h3>
                <p className="font-mono text-xs text-fg-secondary">
                  Processed {importResult.totalProcessed} total records across all collections.
                </p>
              </div>
            </div>

            {/* Overall stats grid (Add, Update, Skip) */}
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-surface border border-emerald-500/30 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <PlusCircle size={14} weight="bold" />
                  <span>Added</span>
                </div>
                <div className="text-lg font-bold text-fg-primary mt-1">
                  +{importResult.added}
                </div>
                <div className="text-[10px] text-fg-muted">New records</div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-blue-500/30 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  <ArrowsClockwise size={14} weight="bold" />
                  <span>Updated</span>
                </div>
                <div className="text-lg font-bold text-fg-primary mt-1">
                  ↻{importResult.updated}
                </div>
                <div className="text-[10px] text-fg-muted">Timestamp sync</div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-default flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-fg-muted">
                  <MinusCircle size={14} weight="bold" />
                  <span>Skipped</span>
                </div>
                <div className="text-lg font-bold text-fg-primary mt-1">
                  ⊘{importResult.skipped}
                </div>
                <div className="text-[10px] text-fg-muted">Identical records</div>
              </div>
            </div>

            {/* Collection breakdown table */}
            <div className="rounded-xl bg-surface border border-default overflow-hidden">
              <div className="px-3.5 py-2 border-b border-subtle bg-elevated/40 text-[11px] font-mono font-semibold text-fg-secondary flex justify-between">
                <span>Collection</span>
                <div className="flex gap-6 pr-2">
                  <span className="text-emerald-500">+Add</span>
                  <span className="text-blue-500">↻Upd</span>
                  <span className="text-fg-muted">⊘Skip</span>
                </div>
              </div>

              <div className="divide-y divide-subtle font-mono text-xs">
                {/* Notes */}
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <NotePencil size={14} className="text-purple-400" />
                    <span>Notes</span>
                  </div>
                  <div className="flex gap-8 pr-3 text-[11px]">
                    <span className="text-emerald-500 font-semibold">
                      {importResult.breakdown.notes.added}
                    </span>
                    <span className="text-blue-500 font-semibold">
                      {importResult.breakdown.notes.updated}
                    </span>
                    <span className="text-fg-muted">
                      {importResult.breakdown.notes.skipped}
                    </span>
                  </div>
                </div>

                {/* Notebook Folders */}
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderSimple size={14} className="text-blue-400" />
                    <span>Note Folders</span>
                  </div>
                  <div className="flex gap-8 pr-3 text-[11px]">
                    <span className="text-emerald-500 font-semibold">
                      {importResult.breakdown.noteFolders.added}
                    </span>
                    <span className="text-blue-500 font-semibold">
                      {importResult.breakdown.noteFolders.updated}
                    </span>
                    <span className="text-fg-muted">
                      {importResult.breakdown.noteFolders.skipped}
                    </span>
                  </div>
                </div>

                {/* 2FA Tokens */}
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={14} className="text-emerald-400" />
                    <span>2FA Authenticator Tokens</span>
                  </div>
                  <div className="flex gap-8 pr-3 text-[11px]">
                    <span className="text-emerald-500 font-semibold">
                      {importResult.breakdown.twoFactorTokens.added}
                    </span>
                    <span className="text-blue-500 font-semibold">
                      {importResult.breakdown.twoFactorTokens.updated}
                    </span>
                    <span className="text-fg-muted">
                      {importResult.breakdown.twoFactorTokens.skipped}
                    </span>
                  </div>
                </div>

                {/* Mail Accounts */}
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple size={14} className="text-amber-400" />
                    <span>Mail Accounts</span>
                  </div>
                  <div className="flex gap-8 pr-3 text-[11px]">
                    <span className="text-emerald-500 font-semibold">
                      {importResult.breakdown.mailAccounts.added}
                    </span>
                    <span className="text-blue-500 font-semibold">
                      {importResult.breakdown.mailAccounts.updated}
                    </span>
                    <span className="text-fg-muted">
                      {importResult.breakdown.mailAccounts.skipped}
                    </span>
                  </div>
                </div>

                {/* Mail Messages */}
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChatText size={14} className="text-cyan-400" />
                    <span>Mail Messages</span>
                  </div>
                  <div className="flex gap-8 pr-3 text-[11px]">
                    <span className="text-emerald-500 font-semibold">
                      {importResult.breakdown.mailMessages.added}
                    </span>
                    <span className="text-blue-500 font-semibold">
                      {importResult.breakdown.mailMessages.updated}
                    </span>
                    <span className="text-fg-muted">
                      {importResult.breakdown.mailMessages.skipped}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
