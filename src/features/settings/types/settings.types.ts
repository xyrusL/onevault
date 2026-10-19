export type SettingsTabId = 'account' | 'backup-import';

export interface AdminAccount {
  email: string;
  role: string;
  createdAt: string;
}

export interface UpdateAccountPayload {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}

export interface UpdateAccountResponse {
  email: string;
  token: string;
  message: string;
}

export interface VaultStats {
  notes?: number;
  noteFolders?: number;
  twoFactorTokens?: number;
  mailAccounts?: number;
  mailSubdomains?: number;
  mailMessages?: number;
  customDomains?: number;
  domainDnsRecords?: number;
  passkeys?: number;
  total: number;
  [key: string]: number | undefined;
}

export type BackupFormat = 'ovault' | 'json' | 'csv';

export interface CollectionStats {
  added: number;
  updated: number;
  skipped: number;
}

export interface ImportSummary {
  added: number;
  updated: number;
  skipped: number;
  totalProcessed: number;
  breakdown: Record<string, CollectionStats>;
}

export interface VaultExportData {
  version: 2;
  app: 'OneVault';
  exportedAt: string;
  hostname?: string;
  counts: VaultStats;
  collections: Record<string, any[]>;
}

export interface ValidationDiagnostics {
  isValid: boolean;
  totalRecords: number;
  collectionCounts: Record<string, number>;
  warnings: string[];
  errors: string[];
}
