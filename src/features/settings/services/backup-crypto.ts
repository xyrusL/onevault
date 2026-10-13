import type { VaultExportData } from '../types/settings.types';

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVault(
  data: VaultExportData,
  passphrase?: string
): Promise<string> {
  const jsonStr = JSON.stringify(data, null, 2);
  if (!passphrase || !passphrase.trim()) {
    // Unencrypted wrapper for .ovault or default bundle
    return JSON.stringify({
      version: 2,
      app: 'OneVault',
      encrypted: false,
      payload: data,
    }, null, 2);
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase.trim(), salt);

  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonStr)
  );

  return JSON.stringify(
    {
      version: 2,
      app: 'OneVault',
      encrypted: true,
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256-100K',
      salt: bufferToHex(salt),
      iv: bufferToHex(iv),
      ciphertext: bufferToHex(ciphertext),
    },
    null,
    2
  );
}

export async function decryptVault(
  rawText: string,
  passphrase?: string
): Promise<VaultExportData> {
  const trimmed = rawText.trim();

  // Try parsing JSON first
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // If not valid JSON, check if it's CSV
    if (trimmed.includes('=== ONEVAULT_') || trimmed.includes('email,forward_to') || trimmed.includes('title,content')) {
      return parseCsvToVault(trimmed);
    }
    throw new Error('Unsupported or corrupted file format. Expected valid JSON, .ovault, or CSV archive.');
  }

  // If encrypted package
  if (parsed.encrypted === true) {
    if (!passphrase || !passphrase.trim()) {
      throw new Error('This vault backup is encrypted. Please provide the encryption password/passphrase.');
    }
    try {
      const salt = hexToBuffer(parsed.salt);
      const iv = hexToBuffer(parsed.iv);
      const ciphertext = hexToBuffer(parsed.ciphertext);
      const key = await deriveKey(passphrase.trim(), salt);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decStr = new TextDecoder().decode(decrypted);
      const data = JSON.parse(decStr) as VaultExportData;
      return validateVaultStructure(data);
    } catch {
      throw new Error('Decryption failed: Incorrect password or corrupted vault bundle.');
    }
  }

  // If unencrypted wrapper
  if (parsed.payload && typeof parsed.payload === 'object') {
    return validateVaultStructure(parsed.payload);
  }

  // If standard export JSON
  return validateVaultStructure(parsed);
}

export function validateVaultStructure(data: any): VaultExportData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid vault structure: missing root object.');
  }

  const collections = data.collections || data;
  const hasValidCollections =
    Array.isArray(collections.notes) ||
    Array.isArray(collections.noteFolders) ||
    Array.isArray(collections.twoFactorTokens) ||
    Array.isArray(collections.mailAccounts) ||
    Array.isArray(collections.mailMessages);

  if (!hasValidCollections) {
    throw new Error('Invalid vault structure: No recognized OneVault collections found (notes, 2FA, or mail).');
  }

  return {
    version: data.version || 2,
    app: data.app || 'OneVault',
    exportedAt: data.exportedAt || new Date().toISOString(),
    counts: {
      mailAccounts: collections.mailAccounts?.length || 0,
      mailSubdomains: collections.mailSubdomains?.length || 0,
      mailMessages: collections.mailMessages?.length || 0,
      twoFactorTokens: collections.twoFactorTokens?.length || 0,
      noteFolders: collections.noteFolders?.length || 0,
      notes: collections.notes?.length || 0,
      total:
        (collections.mailAccounts?.length || 0) +
        (collections.mailSubdomains?.length || 0) +
        (collections.mailMessages?.length || 0) +
        (collections.twoFactorTokens?.length || 0) +
        (collections.noteFolders?.length || 0) +
        (collections.notes?.length || 0),
    },
    collections: {
      mailAccounts: collections.mailAccounts || [],
      mailSubdomains: collections.mailSubdomains || [],
      mailMessages: collections.mailMessages || [],
      twoFactorTokens: collections.twoFactorTokens || [],
      noteFolders: collections.noteFolders || [],
      notes: collections.notes || [],
    },
  };
}

export function exportToCsv(data: VaultExportData): string {
  const sections: string[] = [];

  // Helper escape CSV cell
  const esc = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Section 1: Notes
  sections.push('=== ONEVAULT_NOTES ===');
  sections.push(['id', 'title', 'content', 'folder_id', 'is_pinned', 'tags', 'created_at', 'updated_at'].map(esc).join(','));
  for (const n of data.collections.notes || []) {
    sections.push([
      esc(n.id),
      esc(n.title),
      esc(n.content),
      esc(n.folder_id),
      esc(n.is_pinned),
      esc(typeof n.tags === 'string' ? n.tags : JSON.stringify(n.tags || [])),
      esc(n.created_at),
      esc(n.updated_at),
    ].join(','));
  }

  // Section 2: Note Folders
  sections.push('\n=== ONEVAULT_NOTE_FOLDERS ===');
  sections.push(['id', 'name', 'color', 'icon', 'created_at'].map(esc).join(','));
  for (const f of data.collections.noteFolders || []) {
    sections.push([esc(f.id), esc(f.name), esc(f.color), esc(f.icon), esc(f.created_at)].join(','));
  }

  // Section 3: Two Factor Tokens
  sections.push('\n=== ONEVAULT_TWO_FACTOR ===');
  sections.push(['id', 'issuer', 'label', 'secret', 'algorithm', 'digits', 'period', 'created_at'].map(esc).join(','));
  for (const t of data.collections.twoFactorTokens || []) {
    sections.push([
      esc(t.id),
      esc(t.issuer),
      esc(t.label),
      esc(t.secret),
      esc(t.algorithm),
      esc(t.digits),
      esc(t.period),
      esc(t.created_at),
    ].join(','));
  }

  // Section 4: Mail Accounts
  sections.push('\n=== ONEVAULT_MAIL_ACCOUNTS ===');
  sections.push(['id', 'email', 'forward_to', 'note', 'created_at'].map(esc).join(','));
  for (const a of data.collections.mailAccounts || []) {
    sections.push([esc(a.id), esc(a.email), esc(a.forward_to), esc(a.note), esc(a.created_at)].join(','));
  }

  return sections.join('\n');
}

export function parseCsvToVault(csvText: string): VaultExportData {
  const lines = csvText.split(/\r?\n/);
  let currentSection = '';

  const notes: any[] = [];
  const noteFolders: any[] = [];
  const twoFactorTokens: any[] = [];
  const mailAccounts: any[] = [];

  function parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let insideQuotes = false;
    let entry = '';

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (insideQuotes && row[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(entry);
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry);
    return result;
  }

  let isHeader = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('=== ONEVAULT_')) {
      currentSection = trimmed;
      isHeader = true;
      continue;
    }

    if (isHeader) {
      isHeader = false;
      continue;
    }

    const cols = parseCsvRow(line);

    if (currentSection === '=== ONEVAULT_NOTES ===' && cols.length >= 3) {
      notes.push({
        id: cols[0],
        title: cols[1],
        content: cols[2],
        folder_id: cols[3] || null,
        is_pinned: cols[4] === '1' || cols[4] === 'true' ? 1 : 0,
        tags: cols[5] || '[]',
        created_at: cols[6] || new Date().toISOString(),
        updated_at: cols[7] || new Date().toISOString(),
      });
    } else if (currentSection === '=== ONEVAULT_NOTE_FOLDERS ===' && cols.length >= 2) {
      noteFolders.push({
        id: cols[0],
        name: cols[1],
        color: cols[2] || 'purple',
        icon: cols[3] || null,
        created_at: cols[4] || new Date().toISOString(),
      });
    } else if (currentSection === '=== ONEVAULT_TWO_FACTOR ===' && cols.length >= 4) {
      twoFactorTokens.push({
        id: cols[0],
        issuer: cols[1],
        label: cols[2],
        secret: cols[3],
        algorithm: cols[4] || 'SHA1',
        digits: Number(cols[5]) || 6,
        period: Number(cols[6]) || 30,
        created_at: cols[7] || new Date().toISOString(),
      });
    } else if (currentSection === '=== ONEVAULT_MAIL_ACCOUNTS ===' && cols.length >= 2) {
      mailAccounts.push({
        id: cols[0],
        email: cols[1],
        forward_to: cols[2] || null,
        note: cols[3] || null,
        created_at: cols[4] || new Date().toISOString(),
      });
    }
  }

  return validateVaultStructure({
    collections: {
      notes,
      noteFolders,
      twoFactorTokens,
      mailAccounts,
      mailSubdomains: [],
      mailMessages: [],
    },
  });
}
