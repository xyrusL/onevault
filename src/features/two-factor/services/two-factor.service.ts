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
   * or a raw Base32 secret string, and extracts the real Service Name (`issuer`)
   * and Account (`label`) when present in the URI/QR payload. Never populates fake demo data.
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

    const otpauthMatch = trimmed.match(/otpauth:\/\/[^\s"']+/i);
    if (otpauthMatch || trimmed.toLowerCase().startsWith('otpauth://')) {
      const uriString = otpauthMatch ? otpauthMatch[0] : trimmed;

      // Extract path & query parameters directly so all real-world QR formats work
      const uriPartsMatch = uriString.match(/^otpauth:\/\/([ht]otp)\/([^?]*)(?:\?(.*))?$/i);
      if (!uriPartsMatch) {
        throw new Error('Invalid otpauth:// URI format.');
      }

      const otpType = uriPartsMatch[1].toLowerCase();
      if (otpType !== 'totp') {
        throw new Error('Only TOTP (time-based) 2FA URIs are supported.');
      }

      const rawPath = decodeURIComponent((uriPartsMatch[2] || '').replace(/\+/g, '%20'))
        .replace(/^\/+/, '')
        .trim();
      const rawQuery = uriPartsMatch[3] || '';
      const searchParams = new URLSearchParams(rawQuery);

      const getParam = (key: string): string => {
        for (const [k, v] of searchParams.entries()) {
          if (k.toLowerCase() === key.toLowerCase()) {
            return v.trim();
          }
        }
        return '';
      };

      let pathIssuer = '';
      let pathAccount = '';

      if (rawPath.includes(':')) {
        const colonIdx = rawPath.indexOf(':');
        pathIssuer = rawPath.slice(0, colonIdx).trim();
        pathAccount = rawPath.slice(colonIdx + 1).trim();
      } else if (rawPath.includes('/')) {
        const slashIdx = rawPath.indexOf('/');
        pathIssuer = rawPath.slice(0, slashIdx).trim();
        pathAccount = rawPath.slice(slashIdx + 1).trim();
      } else {
        pathAccount = rawPath;
      }

      const queryIssuer = getParam('issuer') || getParam('service');
      const queryAccount =
        getParam('account') ||
        getParam('username') ||
        getParam('user') ||
        getParam('label');

      let detectedIssuer = queryIssuer || pathIssuer;
      let detectedLabel = pathAccount || queryAccount;

      // Strip redundant "Issuer:" prefix if still present in label
      if (
        detectedIssuer &&
        detectedLabel.toLowerCase().startsWith(`${detectedIssuer.toLowerCase()}:`)
      ) {
        detectedLabel = detectedLabel.slice(detectedIssuer.length + 1).trim();
      }

      // If path only contained the issuer name and query has an account parameter
      if (
        detectedIssuer &&
        detectedLabel.toLowerCase() === detectedIssuer.toLowerCase() &&
        queryAccount
      ) {
        detectedLabel = queryAccount;
      }

      const rawSecret = getParam('secret')
        .replace(/[\s-]+/g, '')
        .replace(/=+$/g, '')
        .toUpperCase();

      if (!rawSecret || !/^[A-Z2-7]+$/.test(rawSecret)) {
        throw new Error('Missing or invalid Base32 secret in otpauth:// URI.');
      }

      const secretObj = OTPAuth.Secret.fromBase32(rawSecret);

      const rawAlgo = getParam('algorithm').toUpperCase();
      const algorithm: 'SHA1' | 'SHA256' | 'SHA512' =
        rawAlgo === 'SHA256' || rawAlgo === 'SHA512' ? rawAlgo : 'SHA1';
      const digits = Number(getParam('digits')) || 6;
      const period = Number(getParam('period')) || 30;

      const finalIssuer = customIssuer?.trim() || detectedIssuer;
      const finalLabel = customLabel?.trim() || detectedLabel;

      const totp = new OTPAuth.TOTP({
        issuer: finalIssuer || undefined,
        label: finalLabel || 'Account',
        algorithm,
        digits,
        period,
        secret: secretObj,
      });

      return {
        id: `2fa-${Date.now()}`,
        issuer: finalIssuer,
        label: finalLabel,
        secret: secretObj.base32,
        algorithm,
        digits,
        period,
        otpauthUri: totp.toString(),
        createdDate,
        createdTime,
      };
    }

    // Support pasting a URL containing ?secret=... or raw Base32 secret key
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
          url.searchParams.get('username') ||
          url.searchParams.get('user') ||
          url.searchParams.get('label');

        if (sec) extractedSecret = sec;
        if (iss) detectedIssuer = iss.trim();
        if (acc) detectedLabel = acc.trim();

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
      .replace(/[\s-]+/g, '')
      .replace(/=+$/g, '')
      .toUpperCase();

    if (cleanBase32.length < 8 || !/^[A-Z2-7]+$/.test(cleanBase32)) {
      throw new Error(
        'Invalid 2FA URL or Base32 secret. Provide an otpauth://totp/... URL or valid Base32 secret key.'
      );
    }

    const secretObj = OTPAuth.Secret.fromBase32(cleanBase32);

    const finalIssuer = customIssuer?.trim() || detectedIssuer || '';
    const finalLabel = customLabel?.trim() || detectedLabel || '';

    const totp = new OTPAuth.TOTP({
      issuer: finalIssuer || undefined,
      label: finalLabel || 'Account',
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
   * Locally decodes a dropped or uploaded QR Code image file using native BarcodeDetector
   * (when available) plus multi-pass `jsQR` with white/dark quiet-zone padding.
   */
  async decodeQrImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file format.'));
        img.onload = async () => {
          // 1. Try native browser BarcodeDetector API first if supported
          try {
            if ('BarcodeDetector' in window) {
              const Detector = (
                window as unknown as {
                  BarcodeDetector: new (opts: { formats: string[] }) => {
                    detect: (source: HTMLImageElement) => Promise<Array<{ rawValue?: string }>>;
                  };
                }
              ).BarcodeDetector;
              const detector = new Detector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(img);
              if (barcodes?.[0]?.rawValue) {
                resolve(barcodes[0].rawValue);
                return;
              }
            }
          } catch {
            // Fall through to canvas jsQR passes
          }

          // 2. Multi-pass jsQR decoding (handles transparent PNGs, cropped QR codes, dark mode, and high-DPI screenshots)
          const tryDecodeCanvas = (
            scale: number,
            padding: number,
            bgColor: string
          ): string | null => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const drawW = Math.max(1, Math.round(img.width * scale));
            const drawH = Math.max(1, Math.round(img.height * scale));
            canvas.width = drawW + padding * 2;
            canvas.height = drawH + padding * 2;

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, padding, padding, drawW, drawH);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: 'attemptBoth',
              }
            );
            return qrResult?.data || null;
          };

          const maxDim = Math.max(img.width, img.height, 1);
          const normalizedScale = maxDim > 800 ? 600 / maxDim : maxDim < 220 ? 360 / maxDim : 1;

          const attempts: Array<[number, number, string]> = [
            [1, 32, '#FFFFFF'],
            [1, 0, '#FFFFFF'],
            [1, 32, '#000000'],
            [normalizedScale, 32, '#FFFFFF'],
            [normalizedScale, 32, '#000000'],
            [1.5, 40, '#FFFFFF'],
          ];

          for (const [scale, pad, bg] of attempts) {
            const decoded = tryDecodeCanvas(scale, pad, bg);
            if (decoded) {
              resolve(decoded);
              return;
            }
          }

          reject(
            new Error(
              'No valid QR code found in this image. Please try a clearer QR image.'
            )
          );
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  },
};
