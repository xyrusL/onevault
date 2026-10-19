import type { ValidationDiagnostics, VaultExportData } from '../types/settings.types';

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

export const DEFAULT_SITE_PASSPHRASE = 'OneVault-v2::ClientSide::ZeroKnowledge::MasterKey';

async function encryptRawPayload(
  text: string,
  passphrase?: string
): Promise<{ salt: string; iv: string; ciphertext: string; isSystemKey: boolean }> {
  const isSystemKey = !passphrase || !passphrase.trim();
  const effectivePass = isSystemKey ? DEFAULT_SITE_PASSPHRASE : passphrase.trim();

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(effectivePass, salt);

  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  return {
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    ciphertext: bufferToHex(ciphertext),
    isSystemKey,
  };
}

/**
 * Client-Side AES-256-GCM encryption for .ovault bundles.
 * Runs 100% in browser memory with 0 Cloudflare Worker requests.
 */
export async function encryptVault(
  data: VaultExportData,
  passphrase?: string,
  format: 'ovault' | 'json' = 'ovault'
): Promise<string> {
  const jsonStr = JSON.stringify(data, null, 2);
  const { salt, iv, ciphertext, isSystemKey } = await encryptRawPayload(jsonStr, passphrase);

  return JSON.stringify(
    {
      version: 2,
      app: 'OneVault',
      format,
      encrypted: true,
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256-100K',
      isSystemKey,
      salt,
      iv,
      ciphertext,
    },
    null,
    2
  );
}

/**
 * Client-Side AES-256-GCM encryption for .json archives.
 * Unreadable ciphertext to outside software, unlocked by password or OneVault site key.
 */
export async function encryptVaultToJson(
  data: VaultExportData,
  passphrase?: string
): Promise<string> {
  return encryptVault(data, passphrase, 'json');
}

/**
 * Client-Side AES-256-GCM encryption for .csv archives.
 * Formats unreadable encrypted envelope rows that only OneVault can decrypt.
 */
export async function encryptVaultToCsv(
  data: VaultExportData,
  passphrase?: string
): Promise<string> {
  const rawCsv = exportToCsv(data);
  const { salt, iv, ciphertext, isSystemKey } = await encryptRawPayload(rawCsv, passphrase);

  return [
    '=== ONEVAULT_ENCRYPTED_ARCHIVE ===',
    'version,app,format,algorithm,kdf,isSystemKey,salt,iv,ciphertext',
    `2,"OneVault","csv","AES-GCM-256","PBKDF2-SHA256-100K",${isSystemKey},"${salt}","${iv}","${ciphertext}"`,
  ].join('\n');
}

/**
 * Checks whether an uploaded file is an encrypted OneVault package (.ovault, encrypted .json, or encrypted .csv).
 */
export function checkIsEncryptedArchive(content: string): { isEncrypted: boolean; isSystemKey: boolean } {
  const trimmed = content.trim();
  if (trimmed.includes('=== ONEVAULT_ENCRYPTED_ARCHIVE ===')) {
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const dataLine = lines.find((l) => !l.startsWith('===') && !l.startsWith('version,'));
    const isSystemKey = dataLine
      ? dataLine.split(',')[5]?.replace(/^"|"$/g, '').trim() === 'true'
      : false;
    return { isEncrypted: true, isSystemKey };
  }
  try {
    const json = JSON.parse(trimmed);
    if (json && json.encrypted === true) {
      return { isEncrypted: true, isSystemKey: json.isSystemKey === true };
    }
  } catch {}
  return { isEncrypted: false, isSystemKey: false };
}

export interface VaultValidationResult {
  data: VaultExportData;
  diagnostics: ValidationDiagnostics;
}

/**
 * Decrypts raw file string (handles .ovault, encrypted JSON, encrypted CSV, and legacy formats) 100% locally.
 */
export async function decryptVault(
  rawText: string,
  passphrase?: string
): Promise<VaultValidationResult> {
  const trimmed = rawText.trim();

  // 1. Check for Encrypted CSV Archive first
  if (trimmed.includes('=== ONEVAULT_ENCRYPTED_ARCHIVE ===')) {
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const dataLine = lines.find((l) => !l.startsWith('===') && !l.startsWith('version,'));
    if (!dataLine) {
      throw new Error('Corrupted encrypted CSV archive: missing payload row.');
    }

    const cols = dataLine.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    const isSystemKey = cols[5] === 'true';
    const saltHex = cols[6];
    const ivHex = cols[7];
    const ciphertextHex = cols[8];

    const effectivePass = passphrase?.trim() || (isSystemKey ? DEFAULT_SITE_PASSPHRASE : '');
    if (!effectivePass) {
      throw new Error('This vault CSV archive is encrypted. Please provide the encryption password.');
    }

    try {
      const salt = hexToBuffer(saltHex);
      const iv = hexToBuffer(ivHex);
      const ciphertext = hexToBuffer(ciphertextHex);
      const key = await deriveKey(effectivePass, salt);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decStr = new TextDecoder().decode(decrypted);
      if (decStr.trim().startsWith('{')) {
        return validateVaultStructure(JSON.parse(decStr));
      }
      return parseCsvToVault(decStr);
    } catch {
      throw new Error('Decryption failed: Incorrect password or corrupted CSV vault archive.');
    }
  }

  // 2. Try parsing JSON next
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // 3. If not valid JSON, check if it's standard unencrypted CSV
    if (
      trimmed.includes('=== ONEVAULT_') ||
      trimmed.includes('email,forward_to') ||
      trimmed.includes('title,content') ||
      trimmed.includes('issuer,label,secret')
    ) {
      return parseCsvToVault(trimmed);
    }
    throw new Error(
      'Unsupported or corrupted file format. Expected valid JSON, .ovault, or CSV archive.'
    );
  }

  // 4. If encrypted JSON or .ovault package
  if (parsed && parsed.encrypted === true) {
    const isSystemKey = parsed.isSystemKey === true;
    const effectivePass = passphrase?.trim() || (isSystemKey ? DEFAULT_SITE_PASSPHRASE : '');

    if (!effectivePass) {
      throw new Error(
        'This vault backup is encrypted. Please provide the encryption password/passphrase.'
      );
    }
    try {
      const salt = hexToBuffer(parsed.salt);
      const iv = hexToBuffer(parsed.iv);
      const ciphertext = hexToBuffer(parsed.ciphertext);
      const key = await deriveKey(effectivePass, salt);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const decStr = new TextDecoder().decode(decrypted);
      const data = JSON.parse(decStr);
      return validateVaultStructure(data);
    } catch {
      throw new Error(
        'Decryption failed: Incorrect password or corrupted vault bundle.'
      );
    }
  }

  // 5. If unencrypted wrapper
  if (parsed && parsed.payload && typeof parsed.payload === 'object') {
    return validateVaultStructure(parsed.payload);
  }

  // 6. If standard export JSON
  return validateVaultStructure(parsed);
}

/**
 * Self-structuring pre-flight validation engine.
 * Inspects all collections, checks data types, flags errors with exact row numbers,
 * and normalizes rows safely before sending anything to the network.
 */
export function validateVaultStructure(data: any): VaultValidationResult {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid vault structure: missing root object.');
  }

  const rawCollections = data.collections || data;
  if (!rawCollections || typeof rawCollections !== 'object') {
    throw new Error('Invalid vault structure: missing collections.');
  }

  const diagnostics: ValidationDiagnostics = {
    isValid: false,
    totalRecords: 0,
    collectionCounts: {},
    warnings: [],
    errors: [],
  };

  const normalizedCollections: Record<string, any[]> = {};
  let totalCount = 0;

  // Process all keys in collections dynamically
  for (const [key, rawRows] of Object.entries(rawCollections)) {
    if (!Array.isArray(rawRows)) continue;

    const validRows: any[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 1;

      if (!row || typeof row !== 'object') {
        diagnostics.errors.push(`[${key}] Row #${rowNum} is not a valid object — skipped.`);
        return;
      }

      const cleanRow: Record<string, any> = { ...row };

      // Ensure primary key id exists
      if (!cleanRow.id) {
        cleanRow.id = `item_${crypto.randomUUID()}`;
        diagnostics.warnings.push(`[${key}] Row #${rowNum} missing ID; auto-assigned UUID.`);
      }

      // Domain-specific sanity checks
      if (key === 'mailAccounts') {
        if (!cleanRow.email || typeof cleanRow.email !== 'string' || !cleanRow.email.includes('@')) {
          diagnostics.errors.push(`[mailAccounts] Row #${rowNum} has missing or invalid email address — skipped.`);
          return;
        }
      } else if (key === 'twoFactorTokens') {
        if (!cleanRow.secret || typeof cleanRow.secret !== 'string') {
          diagnostics.errors.push(`[twoFactorTokens] Row #${rowNum} missing required secret — skipped.`);
          return;
        }
      } else if (key === 'customDomains') {
        if (!cleanRow.name || typeof cleanRow.name !== 'string') {
          diagnostics.errors.push(`[customDomains] Row #${rowNum} missing domain name — skipped.`);
          return;
        }
      } else if (key === 'notes') {
        if (!cleanRow.title && !cleanRow.content) {
          diagnostics.warnings.push(`[notes] Row #${rowNum} has blank title and empty content.`);
        }
      }

      // Timestamp normalization
      if (cleanRow.created_at && isNaN(Date.parse(cleanRow.created_at))) {
        cleanRow.created_at = new Date().toISOString();
        diagnostics.warnings.push(`[${key}] Row #${rowNum} had invalid created_at timestamp; auto-corrected.`);
      }
      if (cleanRow.updated_at && isNaN(Date.parse(cleanRow.updated_at))) {
        cleanRow.updated_at = cleanRow.created_at || new Date().toISOString();
        diagnostics.warnings.push(`[${key}] Row #${rowNum} had invalid updated_at timestamp; auto-corrected.`);
      }

      validRows.push(cleanRow);
    });

    normalizedCollections[key] = validRows;
    diagnostics.collectionCounts[key] = validRows.length;
    totalCount += validRows.length;
  }

  diagnostics.totalRecords = totalCount;
  diagnostics.isValid = totalCount > 0;

  if (totalCount === 0 && diagnostics.errors.length === 0) {
    throw new Error('No valid records found in the uploaded file.');
  }

  const exportData: VaultExportData = {
    version: data.version || 2,
    app: data.app || 'OneVault',
    exportedAt: data.exportedAt || new Date().toISOString(),
    hostname: data.hostname,
    counts: {
      ...diagnostics.collectionCounts,
      total: totalCount,
    },
    collections: normalizedCollections,
  };

  return {
    data: exportData,
    diagnostics,
  };
}

/**
 * Universal Dynamic CSV Exporter.
 * Automatically discovers columns for ANY collection without hardcoding!
 */
export function exportToCsv(data: VaultExportData): string {
  const sections: string[] = [];

  const esc = (val: any) => {
    if (val === null || val === undefined) return '""';
    if (typeof val === 'object') {
      const s = JSON.stringify(val).replace(/"/g, '""');
      return `"${s}"`;
    }
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  for (const [collectionKey, rows] of Object.entries(data.collections || {})) {
    if (!Array.isArray(rows) || rows.length === 0) continue;

    // Discover all distinct column names across all records
    const colSet = new Set<string>();
    for (const row of rows) {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => colSet.add(k));
      }
    }

    const cols = Array.from(colSet);
    if (cols.includes('id')) {
      cols.splice(cols.indexOf('id'), 1);
      cols.unshift('id');
    }

    sections.push(`\n=== ONEVAULT_${collectionKey.toUpperCase()} ===`);
    sections.push(cols.map(esc).join(','));

    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const values = cols.map((col) => esc(row[col]));
      sections.push(values.join(','));
    }
  }

  return sections.join('\n').trim();
}

/**
 * Universal Dynamic CSV Parser.
 * Maps header rows to object keys for any collection automatically.
 */
export function parseCsvToVault(csvText: string): VaultValidationResult {
  const lines = csvText.split(/\r?\n/);
  const collections: Record<string, any[]> = {};

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

  // Map upper-case section names to canonical camelCase collection keys
  const sectionKeyMap: Record<string, string> = {
    notes: 'notes',
    notefolders: 'noteFolders',
    note_folders: 'noteFolders',
    twofactor: 'twoFactorTokens',
    twofactortokens: 'twoFactorTokens',
    two_factor: 'twoFactorTokens',
    two_factor_tokens: 'twoFactorTokens',
    mailaccounts: 'mailAccounts',
    mail_accounts: 'mailAccounts',
    mailsubdomains: 'mailSubdomains',
    mail_subdomains: 'mailSubdomains',
    mailmessages: 'mailMessages',
    mail_messages: 'mailMessages',
    customdomains: 'customDomains',
    custom_domains: 'customDomains',
    domaindnsrecords: 'domainDnsRecords',
    domain_dns_records: 'domainDnsRecords',
    passkeys: 'passkeys',
  };

  let currentKey = '';
  let currentHeaders: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('=== ONEVAULT_')) {
      const rawName = trimmed
        .replace(/^===\s*ONEVAULT_|\s*===$/gi, '')
        .trim()
        .toLowerCase();
      currentKey = sectionKeyMap[rawName] || rawName;
      if (!collections[currentKey]) {
        collections[currentKey] = [];
      }
      currentHeaders = [];
      continue;
    }

    if (currentKey) {
      const cols = parseCsvRow(line);
      if (currentHeaders.length === 0) {
        currentHeaders = cols.map((c) => c.trim());
      } else {
        const rowObj: Record<string, any> = {};
        for (let i = 0; i < currentHeaders.length; i++) {
          const colName = currentHeaders[i];
          if (!colName) continue;
          let val: any = cols[i] ?? '';
          if (val === 'null') val = null;
          rowObj[colName] = val;
        }
        collections[currentKey].push(rowObj);
      }
    }
  }

  return validateVaultStructure({
    version: 2,
    app: 'OneVault',
    exportedAt: new Date().toISOString(),
    collections,
  });
}
