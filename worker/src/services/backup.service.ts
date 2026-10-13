import type { Env } from '../types/env.types';

export interface VaultExportData {
  version: 2;
  app: 'OneVault';
  exportedAt: string;
  hostname?: string;
  counts: {
    mailAccounts: number;
    mailSubdomains: number;
    mailMessages: number;
    twoFactorTokens: number;
    noteFolders: number;
    notes: number;
    total: number;
  };
  collections: {
    mailAccounts: any[];
    mailSubdomains: any[];
    mailMessages: any[];
    twoFactorTokens: any[];
    noteFolders: any[];
    notes: any[];
  };
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
  breakdown: {
    notes: CollectionStats;
    noteFolders: CollectionStats;
    twoFactorTokens: CollectionStats;
    mailAccounts: CollectionStats;
    mailMessages: CollectionStats;
    mailSubdomains: CollectionStats;
  };
}

export const backupService = {
  async getVaultStats(env: Env) {
    if (!env.DB) {
      return {
        mailAccounts: 0,
        mailSubdomains: 0,
        mailMessages: 0,
        twoFactorTokens: 0,
        noteFolders: 0,
        notes: 0,
        total: 0,
      };
    }

    const [accounts, subdomains, messages, tokens, folders, notes] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM mail_accounts').first<{ count: number }>().catch(() => ({ count: 0 })),
      env.DB.prepare('SELECT COUNT(*) as count FROM mail_subdomains').first<{ count: number }>().catch(() => ({ count: 0 })),
      env.DB.prepare('SELECT COUNT(*) as count FROM mail_messages').first<{ count: number }>().catch(() => ({ count: 0 })),
      env.DB.prepare('SELECT COUNT(*) as count FROM two_factor_tokens').first<{ count: number }>().catch(() => ({ count: 0 })),
      env.DB.prepare('SELECT COUNT(*) as count FROM note_folders').first<{ count: number }>().catch(() => ({ count: 0 })),
      env.DB.prepare('SELECT COUNT(*) as count FROM notes').first<{ count: number }>().catch(() => ({ count: 0 })),
    ]);

    const aCount = accounts?.count || 0;
    const sCount = subdomains?.count || 0;
    const mCount = messages?.count || 0;
    const tCount = tokens?.count || 0;
    const fCount = folders?.count || 0;
    const nCount = notes?.count || 0;

    return {
      mailAccounts: aCount,
      mailSubdomains: sCount,
      mailMessages: mCount,
      twoFactorTokens: tCount,
      noteFolders: fCount,
      notes: nCount,
      total: aCount + sCount + mCount + tCount + fCount + nCount,
    };
  },

  async exportVault(env: Env, hostname = 'onevault.local'): Promise<VaultExportData> {
    if (!env.DB) {
      throw new Error('Database not configured');
    }

    const [accountsRes, subdomainsRes, messagesRes, tokensRes, foldersRes, notesRes] = await Promise.all([
      env.DB.prepare('SELECT * FROM mail_accounts ORDER BY created_at DESC').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM mail_subdomains ORDER BY created_at DESC').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM mail_messages ORDER BY received_at DESC').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM two_factor_tokens ORDER BY created_at DESC').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM note_folders ORDER BY created_at ASC').all().catch(() => ({ results: [] })),
      env.DB.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all().catch(() => ({ results: [] })),
    ]);

    const mailAccounts = (accountsRes.results || []) as any[];
    const mailSubdomains = (subdomainsRes.results || []) as any[];
    const mailMessages = (messagesRes.results || []) as any[];
    const twoFactorTokens = (tokensRes.results || []) as any[];
    const noteFolders = (foldersRes.results || []) as any[];
    const notes = (notesRes.results || []) as any[];

    return {
      version: 2,
      app: 'OneVault',
      exportedAt: new Date().toISOString(),
      hostname,
      counts: {
        mailAccounts: mailAccounts.length,
        mailSubdomains: mailSubdomains.length,
        mailMessages: mailMessages.length,
        twoFactorTokens: twoFactorTokens.length,
        noteFolders: noteFolders.length,
        notes: notes.length,
        total:
          mailAccounts.length +
          mailSubdomains.length +
          mailMessages.length +
          twoFactorTokens.length +
          noteFolders.length +
          notes.length,
      },
      collections: {
        mailAccounts,
        mailSubdomains,
        mailMessages,
        twoFactorTokens,
        noteFolders,
        notes,
      },
    };
  },

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
      breakdown: {
        notes: { added: 0, updated: 0, skipped: 0 },
        noteFolders: { added: 0, updated: 0, skipped: 0 },
        twoFactorTokens: { added: 0, updated: 0, skipped: 0 },
        mailAccounts: { added: 0, updated: 0, skipped: 0 },
        mailMessages: { added: 0, updated: 0, skipped: 0 },
        mailSubdomains: { added: 0, updated: 0, skipped: 0 },
      },
    };

    // 1. Process Note Folders
    if (Array.isArray(collections.noteFolders)) {
      for (const folder of collections.noteFolders) {
        if (!folder.name) continue;
        const id = folder.id || `fld_${crypto.randomUUID()}`;
        const name = String(folder.name).trim();
        const color = folder.color || 'purple';
        const icon = folder.icon || null;
        const createdAt = folder.created_at || new Date().toISOString();
        const updatedAt = folder.updated_at || createdAt;

        const existing = await env.DB.prepare(
          'SELECT id, name, updated_at FROM note_folders WHERE id = ? OR lower(name) = ?'
        )
          .bind(id, name.toLowerCase())
          .first<{ id: string; name: string; updated_at?: string }>();

        if (existing) {
          // Compare timestamps: if incoming is newer, update
          const existingTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
          const incomingTime = new Date(updatedAt).getTime();
          if (incomingTime > existingTime) {
            await env.DB.prepare(
              'UPDATE note_folders SET name = ?, color = ?, icon = ?, updated_at = ? WHERE id = ?'
            )
              .bind(name, color, icon, updatedAt, existing.id)
              .run();
            summary.breakdown.noteFolders.updated++;
          } else {
            summary.breakdown.noteFolders.skipped++;
          }
        } else {
          await env.DB.prepare(
            'INSERT INTO note_folders (id, name, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
          )
            .bind(id, name, color, icon, createdAt, updatedAt)
            .run();
          summary.breakdown.noteFolders.added++;
        }
      }
    }

    // 2. Process Notes
    if (Array.isArray(collections.notes)) {
      for (const note of collections.notes) {
        if (!note.title && !note.content) continue;
        const id = note.id || `note_${crypto.randomUUID()}`;
        const title = note.title || 'Untitled Note';
        const content = note.content || '';
        const folderId = note.folder_id || null;
        const color = note.color || 'default';
        const isPinned = note.is_pinned ? 1 : 0;
        const isArchived = note.is_archived ? 1 : 0;
        const tags = typeof note.tags === 'string' ? note.tags : JSON.stringify(note.tags || []);
        const createdAt = note.created_at || new Date().toISOString();
        const updatedAt = note.updated_at || createdAt;

        const existing = await env.DB.prepare(
          'SELECT id, updated_at FROM notes WHERE id = ?'
        )
          .bind(id)
          .first<{ id: string; updated_at: string }>();

        if (existing) {
          const existingTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
          const incomingTime = new Date(updatedAt).getTime();
          if (incomingTime > existingTime) {
            await env.DB.prepare(
              `UPDATE notes SET 
                title = ?, content = ?, folder_id = ?, color = ?, 
                is_pinned = ?, is_archived = ?, tags = ?, updated_at = ? 
               WHERE id = ?`
            )
              .bind(title, content, folderId, color, isPinned, isArchived, tags, updatedAt, existing.id)
              .run();
            summary.breakdown.notes.updated++;
          } else {
            summary.breakdown.notes.skipped++;
          }
        } else {
          await env.DB.prepare(
            `INSERT INTO notes (id, folder_id, title, content, color, is_pinned, is_archived, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(id, folderId, title, content, color, isPinned, isArchived, tags, createdAt, updatedAt)
            .run();
          summary.breakdown.notes.added++;
        }
      }
    }

    // 3. Process Two Factor Tokens
    if (Array.isArray(collections.twoFactorTokens)) {
      for (const token of collections.twoFactorTokens) {
        if (!token.secret) continue;
        const id = token.id || `totp_${crypto.randomUUID()}`;
        const issuer = token.issuer || 'Unknown';
        const label = token.label || 'Account';
        const secret = token.secret;
        const algorithm = token.algorithm || 'SHA1';
        const digits = Number(token.digits) || 6;
        const period = Number(token.period) || 30;
        const otpauthUri = token.otpauth_uri || '';
        const createdAt = token.created_at || new Date().toISOString();

        const existing = await env.DB.prepare(
          'SELECT id, secret, issuer, label FROM two_factor_tokens WHERE id = ? OR (lower(issuer) = ? AND lower(label) = ?)'
        )
          .bind(id, issuer.toLowerCase(), label.toLowerCase())
          .first<{ id: string; secret: string; issuer: string; label: string }>();

        if (existing) {
          if (existing.secret !== secret) {
            await env.DB.prepare(
              'UPDATE two_factor_tokens SET secret = ?, algorithm = ?, digits = ?, period = ?, otpauth_uri = ? WHERE id = ?'
            )
              .bind(secret, algorithm, digits, period, otpauthUri, existing.id)
              .run();
            summary.breakdown.twoFactorTokens.updated++;
          } else {
            summary.breakdown.twoFactorTokens.skipped++;
          }
        } else {
          await env.DB.prepare(
            `INSERT INTO two_factor_tokens (id, issuer, label, secret, algorithm, digits, period, otpauth_uri, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(id, issuer, label, secret, algorithm, digits, period, otpauthUri, createdAt)
            .run();
          summary.breakdown.twoFactorTokens.added++;
        }
      }
    }

    // 4. Process Mail Accounts
    if (Array.isArray(collections.mailAccounts)) {
      for (const acc of collections.mailAccounts) {
        if (!acc.email) continue;
        const email = String(acc.email).trim().toLowerCase();
        const id = acc.id || `acc_${crypto.randomUUID()}`;
        const localPart = acc.local_part || email.split('@')[0];
        const domain = acc.domain || email.split('@')[1];
        const zoneId = acc.zone_id || 'manual_import';
        const routingRuleId = acc.routing_rule_id || null;
        const forwardTo = acc.forward_to || null;
        const note = acc.note || null;
        const createdAt = acc.created_at || new Date().toISOString();

        const existing = await env.DB.prepare(
          'SELECT id, forward_to, note FROM mail_accounts WHERE lower(email) = ? OR id = ?'
        )
          .bind(email, id)
          .first<{ id: string; forward_to: string | null; note: string | null }>();

        if (existing) {
          if (existing.forward_to !== forwardTo || existing.note !== note) {
            await env.DB.prepare(
              'UPDATE mail_accounts SET forward_to = ?, note = ? WHERE id = ?'
            )
              .bind(forwardTo, note, existing.id)
              .run();
            summary.breakdown.mailAccounts.updated++;
          } else {
            summary.breakdown.mailAccounts.skipped++;
          }
        } else {
          await env.DB.prepare(
            `INSERT INTO mail_accounts (id, local_part, domain, email, zone_id, routing_rule_id, forward_to, note, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(id, localPart, domain, email, zoneId, routingRuleId, forwardTo, note, createdAt)
            .run();
          summary.breakdown.mailAccounts.added++;
        }
      }
    }

    // 5. Process Mail Subdomains
    if (Array.isArray(collections.mailSubdomains)) {
      for (const sub of collections.mailSubdomains) {
        if (!sub.full_domain) continue;
        const fullDomain = String(sub.full_domain).trim().toLowerCase();
        const id = sub.id || `sub_${crypto.randomUUID()}`;
        const zoneId = sub.zone_id || 'manual_import';
        const rootDomain = sub.root_domain || fullDomain;
        const subdomain = sub.subdomain || fullDomain.split('.')[0];
        const dnsStatus = sub.dns_status || 'active';
        const createdAt = sub.created_at || new Date().toISOString();

        const existing = await env.DB.prepare(
          'SELECT id FROM mail_subdomains WHERE lower(full_domain) = ?'
        )
          .bind(fullDomain)
          .first<{ id: string }>();

        if (existing) {
          summary.breakdown.mailSubdomains.skipped++;
        } else {
          await env.DB.prepare(
            `INSERT INTO mail_subdomains (id, zone_id, root_domain, subdomain, full_domain, dns_status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(id, zoneId, rootDomain, subdomain, fullDomain, dnsStatus, createdAt)
            .run();
          summary.breakdown.mailSubdomains.added++;
        }
      }
    }

    // 6. Process Mail Messages
    if (Array.isArray(collections.mailMessages)) {
      for (const msg of collections.mailMessages) {
        if (!msg.mail_account_id && !msg.recipient_email) continue;
        const id = msg.id || `msg_${crypto.randomUUID()}`;
        const mailAccountId = msg.mail_account_id;
        const recipientEmail = msg.recipient_email;
        const sender = msg.sender || 'unknown@example.com';
        const senderName = msg.sender_name || 'Sender';
        const subject = msg.subject || '(No Subject)';
        const snippet = msg.snippet || '';
        const textBody = msg.text_body || '';
        const htmlBody = msg.html_body || null;
        const rawMime = msg.raw_mime || '';
        const isRead = msg.is_read ? 1 : 0;
        const receivedAt = msg.received_at || new Date().toISOString();

        const existing = await env.DB.prepare(
          'SELECT id FROM mail_messages WHERE id = ?'
        )
          .bind(id)
          .first<{ id: string }>();

        if (existing) {
          summary.breakdown.mailMessages.skipped++;
        } else {
          await env.DB.prepare(
            `INSERT INTO mail_messages (id, mail_account_id, recipient_email, sender, sender_name, subject, snippet, text_body, html_body, raw_mime, is_read, received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(id, mailAccountId, recipientEmail, sender, senderName, subject, snippet, textBody, htmlBody, rawMime, isRead, receivedAt)
            .run();
          summary.breakdown.mailMessages.added++;
        }
      }
    }

    // Calculate totals
    const bd = summary.breakdown;
    summary.added =
      bd.notes.added +
      bd.noteFolders.added +
      bd.twoFactorTokens.added +
      bd.mailAccounts.added +
      bd.mailSubdomains.added +
      bd.mailMessages.added;

    summary.updated =
      bd.notes.updated +
      bd.noteFolders.updated +
      bd.twoFactorTokens.updated +
      bd.mailAccounts.updated +
      bd.mailSubdomains.updated +
      bd.mailMessages.updated;

    summary.skipped =
      bd.notes.skipped +
      bd.noteFolders.skipped +
      bd.twoFactorTokens.skipped +
      bd.mailAccounts.skipped +
      bd.mailSubdomains.skipped +
      bd.mailMessages.skipped;

    summary.totalProcessed = summary.added + summary.updated + summary.skipped;

    return summary;
  },
};
