import { HttpError } from '../lib/http-error';
import type { Env } from '../types/env.types';
import type {
  CreateTwoFactorInput,
  TotpAlgorithm,
  TwoFactorTokenDto,
  TwoFactorTokenRecord,
} from '../types/two-factor.types';

const ALLOWED_ALGORITHMS = new Set<TotpAlgorithm>(['SHA1', 'SHA256', 'SHA512']);

function toDto(row: TwoFactorTokenRecord): TwoFactorTokenDto {
  return {
    id: row.id,
    issuer: row.issuer,
    label: row.label,
    secret: row.secret,
    algorithm: row.algorithm,
    digits: row.digits,
    period: row.period,
    otpauthUri: row.otpauth_uri,
    createdAt: row.created_at,
  };
}

export const twoFactorService = {
  async list(env: Env): Promise<TwoFactorTokenDto[]> {
    const { results } = await env.DB.prepare(
      'SELECT * FROM two_factor_tokens ORDER BY created_at DESC'
    ).all<TwoFactorTokenRecord>();
    return results.map(toDto);
  },

  async create(env: Env, input: CreateTwoFactorInput): Promise<TwoFactorTokenDto> {
    const issuer = input.issuer.trim();
    const label = input.label.trim();
    const secret = input.secret.replace(/\s+/g, '').toUpperCase();
    const otpauthUri = input.otpauthUri.trim();

    if (!issuer || !label || !secret || !otpauthUri) {
      throw new HttpError(400, 'issuer, label, secret, and otpauthUri are required.');
    }

    const algorithm: TotpAlgorithm =
      input.algorithm && ALLOWED_ALGORITHMS.has(input.algorithm)
        ? input.algorithm
        : 'SHA1';
    const digits = Number(input.digits) || 6;
    const period = Number(input.period) || 30;
    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO two_factor_tokens (id, issuer, label, secret, algorithm, digits, period, otpauth_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, issuer, label, secret, algorithm, digits, period, otpauthUri)
      .run();

    const row = await env.DB.prepare('SELECT * FROM two_factor_tokens WHERE id = ?')
      .bind(id)
      .first<TwoFactorTokenRecord>();
    return toDto(row as TwoFactorTokenRecord);
  },

  async remove(env: Env, id: string): Promise<void> {
    const result = await env.DB.prepare('DELETE FROM two_factor_tokens WHERE id = ?')
      .bind(id)
      .run();
    if (!result.meta.changes) {
      throw new HttpError(404, '2FA token not found.');
    }
  },
};
