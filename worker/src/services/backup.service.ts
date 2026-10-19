import type { Env } from '../types/env.types';

export interface VaultTableMeta {
  collectionKey: string;
  tableName: string;
  pk: string;
  orderClause: string;
}

export const VAULT_TABLES: VaultTableMeta[] = [
  { collectionKey: 'noteFolders', tableName: 'note_folders', pk: 'id', orderClause: 'created_at ASC' },
  { collectionKey: 'notes', tableName: 'notes', pk: 'id', orderClause: 'updated_at DESC' },
  { collectionKey: 'twoFactorTokens', tableName: 'two_factor_tokens', pk: 'id', orderClause: 'created_at DESC' },
  { collectionKey: 'mailSubdomains', tableName: 'mail_subdomains', pk: 'id', orderClause: 'created_at DESC' },
  { collectionKey: 'mailAccounts', tableName: 'mail_accounts', pk: 'id', orderClause: 'created_at DESC' },
  { collectionKey: 'mailMessages', tableName: 'mail_messages', pk: 'id', orderClause: 'received_at DESC' },
  { collectionKey: 'customDomains', tableName: 'custom_domains', pk: 'id', orderClause: 'created_at DESC' },
  { collectionKey: 'domainDnsRecords', tableName: 'domain_dns_records', pk: 'id', orderClause: 'created_at DESC' },
  { collectionKey: 'passkeys', tableName: 'passkeys', pk: 'id', orderClause: 'created_at DESC' },
];

export interface VaultExportData {
  version: 2;
  app: 'OneVault';
  exportedAt: string;
  hostname?: string;
  counts: Record<string, number>;
  collections: Record<string, any[]>;
}

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

export const backupService = {
  /**
   * Fetches real-time counts across all vault tables dynamically.
   */
  async getVaultStats(env: Env): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    let total = 0;

    if (!env.DB) {
      for (const t of VAULT_TABLES) {
        stats[t.collectionKey] = 0;
      }
      stats.total = 0;
      return stats;
    }

    await Promise.all(
      VAULT_TABLES.map(async ({ collectionKey, tableName }) => {
        try {
          const res = await env.DB.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).first<{ count: number }>();
          const count = res?.count || 0;
          stats[collectionKey] = count;
          total += count;
        } catch {
          stats[collectionKey] = 0;
        }
      })
    );

    stats.total = total;
    return stats;
  },

  /**
   * Dynamically exports all vault collections and metadata.
   */
  async exportVault(env: Env, hostname = 'onevault.local'): Promise<VaultExportData> {
    if (!env.DB) {
      throw new Error('Database not configured');
    }

    const collections: Record<string, any[]> = {};
    const counts: Record<string, number> = {};
    let total = 0;

    await Promise.all(
      VAULT_TABLES.map(async ({ collectionKey, tableName, orderClause }) => {
        try {
          const res = await env.DB.prepare(`SELECT * FROM "${tableName}" ORDER BY ${orderClause}`).all();
          const rows = res.results || [];
          collections[collectionKey] = rows;
          counts[collectionKey] = rows.length;
          total += rows.length;
        } catch {
          collections[collectionKey] = [];
          counts[collectionKey] = 0;
        }
      })
    );

    counts.total = total;

    return {
      version: 2,
      app: 'OneVault',
      exportedAt: new Date().toISOString(),
      hostname,
      counts,
      collections,
    };
  },

  /**
   * Dynamically and atomically imports vault collections into D1 using batched upserts.
   * Self-discovers columns so schema additions never break imports.
   */
  async importVault(env: Env, data: any): Promise<ImportSummary> {
    if (!env.DB) {
      throw new Error('Database not configured');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid vault import payload: expected an object.');
    }

    const collections = data.collections || data;
    const summary: ImportSummary = {
      added: 0,
      updated: 0,
      skipped: 0,
      totalProcessed: 0,
      breakdown: {},
    };

    // Cache column definitions to avoid redundant PRAGMA queries
    const columnCache = new Map<string, Set<string>>();

    async function getColumns(tableName: string): Promise<Set<string>> {
      if (columnCache.has(tableName)) {
        return columnCache.get(tableName)!;
      }
      try {
        const pragma = await env.DB.prepare(`PRAGMA table_info("${tableName}")`).all<{ name: string }>();
        const cols = new Set((pragma.results || []).map((r) => r.name));
        columnCache.set(tableName, cols);
        return cols;
      } catch {
        const empty = new Set<string>();
        columnCache.set(tableName, empty);
        return empty;
      }
    }

    // Process collections in dependency order (defined in VAULT_TABLES)
    for (const { collectionKey, tableName, pk } of VAULT_TABLES) {
      summary.breakdown[collectionKey] = { added: 0, updated: 0, skipped: 0 };
      const rows = collections[collectionKey];

      if (!Array.isArray(rows) || rows.length === 0) {
        continue;
      }

      const validCols = await getColumns(tableName);
      if (validCols.size === 0) {
        summary.breakdown[collectionKey].skipped += rows.length;
        continue;
      }

      // Collect existing IDs in this table to differentiate added vs updated
      const existingIds = new Set<string>();
      try {
        const idRes = await env.DB.prepare(`SELECT "${pk}" as id FROM "${tableName}"`).all<{ id: string }>();
        for (const row of idRes.results || []) {
          if (row.id) existingIds.add(String(row.id));
        }
      } catch {
        // Continue if empty or query fails
      }

      const statements: any[] = [];

      for (const rawRow of rows) {
        if (!rawRow || typeof rawRow !== 'object') {
          summary.breakdown[collectionKey].skipped++;
          continue;
        }

        const id = rawRow[pk] || (pk === 'id' ? `item_${crypto.randomUUID()}` : null);
        if (!id) {
          summary.breakdown[collectionKey].skipped++;
          continue;
        }

        // Clone row and guarantee primary key is set
        const row = { ...rawRow, [pk]: id };

        // Filter keys to only those columns physically existing in the target D1 table
        const matchingCols = Object.keys(row).filter((col) => validCols.has(col));
        if (matchingCols.length === 0) {
          summary.breakdown[collectionKey].skipped++;
          continue;
        }

        const updateCols = matchingCols.filter((col) => col !== pk);

        let sql = '';
        const values: any[] = [];

        if (updateCols.length > 0) {
          sql = `INSERT INTO "${tableName}" (${matchingCols.map((c) => `"${c}"`).join(', ')})
                 VALUES (${matchingCols.map(() => '?').join(', ')})
                 ON CONFLICT("${pk}") DO UPDATE SET
                 ${updateCols.map((c) => `"${c}" = excluded."${c}"`).join(', ')}`;
        } else {
          sql = `INSERT OR IGNORE INTO "${tableName}" (${matchingCols.map((c) => `"${c}"`).join(', ')})
                 VALUES (${matchingCols.map(() => '?').join(', ')})`;
        }

        for (const col of matchingCols) {
          let val = row[col];
          // Normalize objects/arrays to JSON strings if stored in text column
          if (val !== null && typeof val === 'object') {
            val = JSON.stringify(val);
          }
          values.push(val);
        }

        statements.push(env.DB.prepare(sql).bind(...values));

        if (existingIds.has(String(id))) {
          summary.breakdown[collectionKey].updated++;
        } else {
          summary.breakdown[collectionKey].added++;
          existingIds.add(String(id));
        }
      }

      // Execute in atomic chunks of 50 statements (well within D1 batch limits)
      const CHUNK_SIZE = 50;
      for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
        const chunk = statements.slice(i, i + CHUNK_SIZE);
        if (chunk.length > 0) {
          await env.DB.batch(chunk);
        }
      }
    }

    // Compute totals
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const stats of Object.values(summary.breakdown)) {
      totalAdded += stats.added;
      totalUpdated += stats.updated;
      totalSkipped += stats.skipped;
    }

    summary.added = totalAdded;
    summary.updated = totalUpdated;
    summary.skipped = totalSkipped;
    summary.totalProcessed = totalAdded + totalUpdated + totalSkipped;

    return summary;
  },
};
