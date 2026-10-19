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
  Globe,
  Fingerprint,
  Database,
  Warning,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../shared/components/modals/BaseModal';
import { checkIsEncryptedArchive, decryptVault } from '../services/backup-crypto';
import { settingsService } from '../services/settings.service';
import type { ImportSummary, ValidationDiagnostics, VaultExportData } from '../types/settings.types';

type ImportInputMode = 'upload' | 'url' | 'raw';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// Friendly collection display helper
function getCollectionMeta(key: string): { label: string; icon: React.ReactNode } {
  switch (key) {
    case 'notes':
      return { label: 'Notes', icon: <NotePencil size={14} className="text-purple-400" /> };
    case 'noteFolders':
      return { label: 'Note Folders', icon: <FolderSimple size={14} className="text-blue-400" /> };
    case 'twoFactorTokens':
      return { label: '2FA Authenticators', icon: <Key size={14} className="text-emerald-400" /> };
    case 'mailAccounts':
      return { label: 'Mail Accounts', icon: <EnvelopeSimple size={14} className="text-amber-400" /> };
    case 'mailSubdomains':
      return { label: 'Mail Subdomains', icon: <Globe size={14} className="text-teal-400" /> };
    case 'mailMessages':
      return { label: 'Mail Messages', icon: <ChatText size={14} className="text-cyan-400" /> };
    case 'customDomains':
      return { label: 'Custom Domains', icon: <Globe size={14} className="text-indigo-400" /> };
    case 'domainDnsRecords':
      return { label: 'DNS Records', icon: <Database size={14} className="text-sky-400" /> };
    case 'passkeys':
      return { label: 'Passkeys (WebAuthn)', icon: <Fingerprint size={14} className="text-rose-400" /> };
    default:
      return { label: key, icon: <Database size={14} className="text-fg-muted" /> };
  }
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
  const [diagnostics, setDiagnostics] = useState<ValidationDiagnostics | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setRawText('');
    setUrlInput('');
    setFileName('');
    setPassphrase('');
    setIsEncryptedBundle(false);
    setParsedData(null);
    setDiagnostics(null);
    setIsValidating(false);
    setIsImporting(false);
    setImportProgress(0);
    setProgressStatus('');
    setImportResult(null);
    setErrorMsg(null);
    setShowErrorDetails(false);
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  // Inspect raw payload on device with pre-flight self-structuring verification
  const inspectAndValidate = async (content: string, customPassphrase?: string) => {
    setErrorMsg(null);
    setIsValidating(true);
    try {
      const trimmed = content.trim();

      // Check if encrypted container (.ovault, encrypted .json, or encrypted .csv)
      const { isEncrypted, isSystemKey } = checkIsEncryptedArchive(trimmed);
      const pass = customPassphrase ?? passphrase;

      // If user password is required and not provided yet, show password prompt
      if (isEncrypted && !isSystemKey && !pass.trim()) {
        setIsEncryptedBundle(true);
        setIsValidating(false);
        return; // Wait for user to input passphrase
      }

      // Runs 100% on the user's machine in browser memory (0 Worker requests)
      const result = await decryptVault(content, pass);
      setParsedData(result.data);
      setDiagnostics(result.diagnostics);
    } catch (err: any) {
      setParsedData(null);
      setDiagnostics(null);
      setErrorMsg(err.message || 'Invalid or unreadable vault archive.');
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
      setDiagnostics(null);
    }
  };

  // Re-run validation when passphrase changes
  const handlePassphraseApply = async () => {
    if (rawText) {
      await inspectAndValidate(rawText, passphrase);
    }
  };

  // Execute smart merge into D1 via atomic single-request batch
  const handleBeginImport = async () => {
    if (!parsedData) return;
    try {
      setIsImporting(true);
      setErrorMsg(null);
      setImportProgress(10);
      setProgressStatus('Preparing validated collections on device...');

      await new Promise((r) => setTimeout(r, 200));
      setImportProgress(35);
      setProgressStatus('Connecting to D1 edge storage (1 request)...');

      await new Promise((r) => setTimeout(r, 200));
      setImportProgress(65);
      setProgressStatus('Executing atomic D1 database batch upserts...');

      const summary = await settingsService.importVaultData(parsedData);

      await new Promise((r) => setTimeout(r, 200));
      setImportProgress(100);
      setProgressStatus('Synchronization completed successfully!');
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
      subtitle="Self-structuring data restoration with pre-flight error inspection"
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
      <div className="space-y-4 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto pr-1">
        {/* Phase 1: Input & Verification */}
        {!importResult && !isImporting && (
          <>
            {/* Input method selection tabs - compact for mobile */}
            <div className="flex items-center p-1 rounded-lg bg-surface border border-default text-xs">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-elevated text-fg-primary shadow-xs font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <UploadSimple size={14} />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'url'
                    ? 'bg-elevated text-fg-primary shadow-xs font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <Link size={14} />
                <span>URL</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('raw')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'raw'
                    ? 'bg-elevated text-fg-primary shadow-xs font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <CodeBlock size={14} />
                <span>Paste</span>
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
                className="border-2 border-dashed border-default hover:border-accent rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-colors bg-surface/50 hover:bg-surface flex flex-col items-center justify-center gap-2"
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
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-accent-muted border border-accent/20 text-accent">
                  <UploadSimple size={20} weight="duotone" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-fg-primary">
                    {fileName ? (
                      <span className="text-accent font-mono break-all">{fileName}</span>
                    ) : (
                      'Click to upload or drag & drop archive'
                    )}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-fg-muted font-mono mt-0.5">
                    Supports .ovault (AES encrypted), .json, and .csv
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Paste URL */}
            {mode === 'url' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-fg-primary">
                  Vault Archive URL
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
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-fg-primary">
                  Paste JSON or CSV Content
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder="Paste JSON or CSV archive payload directly here"
                  className="w-full p-2.5 rounded-lg bg-surface border border-default text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none font-mono resize-none"
                />
              </div>
            )}

            {/* Encrypted Password Prompt */}
            {isEncryptedBundle && (
              <div className="rounded-xl bg-surface border border-accent/30 p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                  <LockKey size={16} weight="bold" />
                  <span>Encrypted Archive Detected</span>
                </div>
                <p className="text-[11px] text-fg-secondary font-mono">
                  Protected with AES-256-GCM. Decryption runs 100% locally on your device:
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
                <span>Running client-side pre-flight schema analysis (0 quota)...</span>
              </div>
            )}

            {/* Pre-Flight Inspection Results & Diagnostics */}
            {parsedData && diagnostics && (
              <div className="rounded-xl bg-surface border border-default p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={16} weight="fill" />
                    <span>Self-Structuring Verification Passed</span>
                  </div>
                  <span className="font-mono text-[11px] text-accent font-bold">
                    {diagnostics.totalRecords} records ready
                  </span>
                </div>

                {/* Dynamic Collections Grid - Auto adapts from mobile to desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                  {Object.entries(diagnostics.collectionCounts).map(([colKey, count]) => {
                    const meta = getCollectionMeta(colKey);
                    return (
                      <div
                        key={colKey}
                        className="p-2 rounded-lg bg-elevated/40 border border-subtle flex items-center justify-between gap-1.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {meta.icon}
                          <span className="text-[11px] text-fg-secondary truncate">
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-fg-primary shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Pre-flight Warnings / Errors Report (Row diagnostics) */}
                {(diagnostics.errors.length > 0 || diagnostics.warnings.length > 0) && (
                  <div className="pt-2 border-t border-subtle space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowErrorDetails((prev) => !prev)}
                      className="w-full flex items-center justify-between text-[11px] font-mono text-amber-500 hover:text-amber-400 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Warning size={14} weight="bold" />
                        <span>
                          Diagnostics: {diagnostics.errors.length} skipped rows,{' '}
                          {diagnostics.warnings.length} auto-corrections
                        </span>
                      </span>
                      <span>{showErrorDetails ? 'Hide details' : 'View details'}</span>
                    </button>

                    {showErrorDetails && (
                      <div className="max-h-32 overflow-y-auto p-2 rounded-lg bg-surface-solid border border-default text-[10px] font-mono space-y-1">
                        {diagnostics.errors.map((err, i) => (
                          <div key={`err-${i}`} className="text-rose-400 flex items-start gap-1">
                            <span className="shrink-0">✕</span>
                            <span>{err}</span>
                          </div>
                        ))}
                        {diagnostics.warnings.map((warn, i) => (
                          <div key={`warn-${i}`} className="text-amber-400 flex items-start gap-1">
                            <span className="shrink-0">⚠</span>
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 font-mono flex items-start gap-2">
                <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
                <span className="break-all">{errorMsg}</span>
              </div>
            )}
          </>
        )}

        {/* Phase 2: Processing Live Progress GUI (Responsive Mobile & Desktop) */}
        {isImporting && !importResult && (
          <div className="space-y-4 py-4 px-2">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted border border-accent/20 text-accent animate-pulse">
                <ArrowsClockwise size={28} className="animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm sm:text-base font-bold text-fg-primary">
                  Synchronizing Vault Database
                </h3>
                <p className="font-mono text-xs text-fg-secondary">
                  {progressStatus}
                </p>
              </div>
            </div>

            {/* Responsive progress bar with percentage pill */}
            <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-default">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-fg-muted flex items-center gap-1.5">
                  <Database size={13} className="text-accent" />
                  <span>D1 Batch Sync</span>
                </span>
                <span className="font-bold text-accent px-2 py-0.5 rounded-full bg-accent-muted text-[11px]">
                  {importProgress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-300 rounded-full"
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
                  Processed {importResult.totalProcessed} total records in 1 atomic transaction.
                </p>
              </div>
            </div>

            {/* Overall stats grid (Add, Update, Skip) - Responsive 3-column */}
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-2.5 sm:p-3 rounded-xl bg-surface border border-emerald-500/30 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <PlusCircle size={14} weight="bold" />
                  <span>Added</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-fg-primary mt-0.5">
                  +{importResult.added}
                </div>
                <div className="text-[10px] text-fg-muted">New records</div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-surface border border-blue-500/30 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  <ArrowsClockwise size={14} weight="bold" />
                  <span>Updated</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-fg-primary mt-0.5">
                  ↻{importResult.updated}
                </div>
                <div className="text-[10px] text-fg-muted">Synchronized</div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-surface border border-default flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-fg-muted">
                  <MinusCircle size={14} weight="bold" />
                  <span>Skipped</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-fg-primary mt-0.5">
                  ⊘{importResult.skipped}
                </div>
                <div className="text-[10px] text-fg-muted">Unchanged</div>
              </div>
            </div>

            {/* Dynamic Collection breakdown table - renders ANY collection automatically */}
            <div className="rounded-xl bg-surface border border-default overflow-hidden">
              <div className="px-3.5 py-2 border-b border-subtle bg-elevated/40 text-[11px] font-mono font-semibold text-fg-secondary flex justify-between">
                <span>Collection</span>
                <div className="flex gap-4 sm:gap-6 pr-1">
                  <span className="text-emerald-500">+Add</span>
                  <span className="text-blue-500">↻Upd</span>
                  <span className="text-fg-muted">⊘Skip</span>
                </div>
              </div>

              <div className="divide-y divide-subtle font-mono text-xs max-h-48 overflow-y-auto">
                {Object.entries(importResult.breakdown || {}).map(([colKey, stats]) => {
                  const meta = getCollectionMeta(colKey);
                  return (
                    <div key={colKey} className="px-3.5 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {meta.icon}
                        <span className="truncate">{meta.label}</span>
                      </div>
                      <div className="flex gap-6 sm:gap-8 pr-2 text-[11px] shrink-0">
                        <span className="text-emerald-500 font-semibold w-6 text-right">
                          {stats.added}
                        </span>
                        <span className="text-blue-500 font-semibold w-6 text-right">
                          {stats.updated}
                        </span>
                        <span className="text-fg-muted font-semibold w-6 text-right">
                          {stats.skipped}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
