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
  mailAccounts: number;
  mailSubdomains: number;
  mailMessages: number;
  twoFactorTokens: number;
  noteFolders: number;
  notes: number;
  total: number;
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
  breakdown: {
    notes: CollectionStats;
    noteFolders: CollectionStats;
    twoFactorTokens: CollectionStats;
    mailAccounts: CollectionStats;
    mailMessages: CollectionStats;
    mailSubdomains: CollectionStats;
  };
}

export interface VaultExportData {
  version: 2;
  app: 'OneVault';
  exportedAt: string;
  hostname?: string;
  counts: VaultStats;
  collections: {
    mailAccounts: any[];
    mailSubdomains: any[];
    mailMessages: any[];
    twoFactorTokens: any[];
    noteFolders: any[];
    notes: any[];
  };
}
