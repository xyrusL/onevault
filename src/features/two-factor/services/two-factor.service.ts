import * as OTPAuth from 'otpauth';
import jsQR from 'jsqr';
import { apiRequest } from '../../../shared/services/api-client.service';
import {
  CreateTwoFactorPayload,
  LiveTotpCode,
  TwoFactorTokenItem,
} from '../types/two-factor.types';

interface TwoFactorTokenDto {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  otpauthUri: string;
  createdAt: string;
}

const LEGACY_DEMO_STORAGE_KEY = 'onevault-temp-2fa-tokens';
const CACHE_STORAGE_KEY = 'onevault.two-factor.cache.v1';

// Clean up any legacy demo tokens from earlier localStorage builds
try {
  localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
} catch {
  // Ignore storage errors
}

let memoryCache: TwoFactorTokenItem[] | null = (() => {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TwoFactorTokenItem[]) : null;
  } catch {
    return null;
  }
})();

function persistCache(tokens: TwoFactorTokenItem[]) {
  memoryCache = tokens;
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Ignore storage quota errors
  }
}

function toItem(dto: TwoFactorTokenDto): TwoFactorTokenItem {
  const created = new Date(dto.createdAt);
  return {
    id: dto.id,
    issuer: dto.issuer,
    label: dto.label,
    secret: dto.secret,
    algorithm: dto.algorithm,
    digits: dto.digits,
    period: dto.period,
    otpauthUri: dto.otpauthUri,
    createdDate: created.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    createdTime: created.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export const twoFactorService = {
  /** Returns last known D1 tokens synchronously so UI renders without flashing. */
  getCached(): TwoFactorTokenItem[] | null {
    return memoryCache;
  },

  /** Fetches all saved 2FA tokens from `onevault-storage` D1 via `/api/two-factor`. */
  async list(): Promise<TwoFactorTokenItem[]> {
    const rows = await apiRequest<TwoFactorTokenDto[]>('/two-factor');
    const items = rows.map(toItem);
    persistCache(items);
    return items;
  },

  /** Creates a new 2FA token row in `onevault-storage` D1 via `POST /api/two-factor`. */
  async create(payload: CreateTwoFactorPayload): Promise<TwoFactorTokenItem> {
    const dto = await apiRequest<TwoFactorTokenDto>('/two-factor', {
      method: 'POST',
      body: payload,
    });
    const created = toItem(dto);
    persistCache([created, ...(memoryCache ?? [])]);
    return created;
  },

  /** Deletes a 2FA token from `onevault-storage` D1 via `DELETE /api/two-factor/:id`. */
  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/two-factor/${id}`, { method: 'DELETE' });
    if (memoryCache) {
      persistCache(memoryCache.filter((t) => t.id !== id));
    }
  },

  /**
   * Generates the live TOTP 6-digit code and countdown progress using `otpauth`.
   */
  generateLiveCode(item: TwoFactorTokenItem, nowMs = Date.now()): LiveTotpCode {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: item.issuer,
        label: item.label,
        algorithm: item.algorithm,
        digits: item.digits,
        period: item.period,
        secret: OTPAuth.Secret.fromBase32(
          item.secret.replace(/\s+/g, '').toUpperCase()
        ),
      });

      const rawCode = totp.generate({ timestamp: nowMs });
      const mid = Math.ceil(rawCode.length / 2);
      const formattedCode = `${rawCode.slice(0, mid)} ${rawCode.slice(mid)}`;

      const epochSeconds = Math.floor(nowMs / 1000);
      const elapsed = epochSeconds % item.period;
      const remainingSeconds = item.period - elapsed;
      const progressPercent = (remainingSeconds / item.period) * 100;

      return {
        formattedCode,
        rawCode,
        remainingSeconds,
        progressPercent,
      };
    } catch {
      return {
        formattedCode: '000 000',
        rawCode: '000000',
        remainingSeconds: 30,
        progressPercent: 100,
      };
    }
  },

  /**
   * Parses either a full `otpauth://totp/...` URI, a URL with query parameters,
   * or a raw Base32 secret string, and automatically extracts/generates the
   * Service Name (`issuer`) and Account (`label`).
   */
  parseOtpInput(
    input: string,
    customIssuer?: string,
    customLabel?: string
  ): TwoFactorTokenItem {
    const trimmed = input.trim();
    const now = new Date();
    const createdDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const createdTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (trimmed.toLowerCase().startsWith('otpauth://')) {
      const parsed = OTPAuth.URI.parse(trimmed);
      if (!(parsed instanceof OTPAuth.TOTP)) {
        throw new Error('Only TOTP (time-based) 2FA URIs are supported.');
      }

      let detectedIssuer = parsed.issuer?.trim() || '';
      let detectedLabel = parsed.label?.trim() || '';

      // If label contains "Issuer:account" and issuer was empty, split it
      if (!detectedIssuer && detectedLabel.includes(':')) {
        const [prefix, ...rest] = detectedLabel.split(':');
        detectedIssuer = prefix.trim();
        detectedLabel = rest.join(':').trim();
      }

      const finalIssuer =
        customIssuer?.trim() || detectedIssuer || 'OneVault Token';
      const finalLabel =
        customLabel?.trim() || detectedLabel || 'vault@ainxe.com';
      const secretBase32 = parsed.secret.base32;

      return {
        id: `2fa-${Date.now()}`,
        issuer: finalIssuer,
        label: finalLabel,
        secret: secretBase32,
        algorithm: (parsed.algorithm as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1',
        digits: parsed.digits || 6,
        period: parsed.period || 30,
        otpauthUri: parsed.toString(),
        createdDate,
        createdTime,
      };
    }

    // Support pasting a URL containing ?secret=... or raw Base32 secret
    let extractedSecret = trimmed;
    let detectedIssuer = '';
    let detectedLabel = '';

    if (trimmed.includes('secret=') || trimmed.startsWith('http')) {
      try {
        const url = new URL(
          trimmed.startsWith('http')
            ? trimmed
            : `https://onevault.local/${trimmed.replace(/^\//, '')}`
        );
        const sec = url.searchParams.get('secret');
        const iss =
          url.searchParams.get('issuer') || url.searchParams.get('service');
        const acc =
          url.searchParams.get('account') ||
          url.searchParams.get('label') ||
          url.searchParams.get('email');

        if (sec) extractedSecret = sec;
        if (iss) detectedIssuer = iss;
        if (acc) detectedLabel = acc;

        if (!detectedIssuer && url.hostname !== 'onevault.local') {
          detectedIssuer = url.hostname.replace(/^www\./, '').split('.')[0];
          detectedIssuer =
            detectedIssuer.charAt(0).toUpperCase() + detectedIssuer.slice(1);
        }
      } catch {
        const match = trimmed.match(/secret=([A-Z2-7=]+)/i);
        if (match) extractedSecret = match[1];
      }
    }

    const cleanBase32 = extractedSecret
      .replace(/[^A-Za-z2-7]/g, '')
      .toUpperCase();
    if (cleanBase32.length < 8) {
      throw new Error(
        'Invalid 2FA URL or Base32 secret. Provide an otpauth://totp/... URL or valid secret key.'
      );
    }

    const secretObj = OTPAuth.Secret.fromBase32(cleanBase32);
    const shortTag = cleanBase32.slice(0, 4).toLowerCase();

    const finalIssuer =
      customIssuer?.trim() ||
      detectedIssuer ||
      `Vault Key (${cleanBase32.slice(0, 4)})`;
    const finalLabel =
      customLabel?.trim() || detectedLabel || `token.${shortTag}@ainxe.com`;

    const totp = new OTPAuth.TOTP({
      issuer: finalIssuer,
      label: finalLabel,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretObj,
    });

    return {
      id: `2fa-${Date.now()}`,
      issuer: finalIssuer,
      label: finalLabel,
      secret: secretObj.base32,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      otpauthUri: totp.toString(),
      createdDate,
      createdTime,
    };
  },

  /**
   * Locally decodes a dropped or uploaded QR Code image file using `jsQR` on an HTML5 Canvas.
   */
  async decodeQrImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file format.'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable.'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qrResult = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: 'attemptBoth',
            }
          );

          if (!qrResult || !qrResult.data) {
            reject(
              new Error(
                'No valid QR code found in this image. Please try a clearer QR image.'
              )
            );
            return;
          }

          resolve(qrResult.data);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  },
};
