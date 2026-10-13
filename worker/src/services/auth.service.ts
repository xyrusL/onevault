import { HttpError } from '../lib/http-error';
import type { Env } from '../types/env.types';

const encoder = new TextEncoder();
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  email: string;
  exp: number;
  iat?: number;
  jti?: string;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string, usage: 'sign' | 'verify') {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

/** Constant-time string comparison via HMAC of both values. */
async function safeEqual(a: string, b: string, secret: string): Promise<boolean> {
  const key = await hmacKey(secret, 'sign');
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const authService = {
  async verifyCredentials(env: Env, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const sessionSecret = env.SESSION_SECRET || 'onevault-auth-salt';

    // 1. Check D1 admin_users database table
    if (env.DB) {
      try {
        const user = await env.DB.prepare(
          'SELECT password_hash FROM admin_users WHERE lower(email) = ?'
        )
          .bind(normalizedEmail)
          .first<{ password_hash: string }>();

        if (user && user.password_hash) {
          const hashedInput = await sha256Hex(password);
          const isHashMatch = await safeEqual(user.password_hash, hashedInput, sessionSecret);
          const isPlainMatch = await safeEqual(user.password_hash, password, sessionSecret);
          if (isHashMatch || isPlainMatch) {
            return true;
          }
          return false;
        }
      } catch (err) {
        console.warn('D1 auth query failed or table not found:', err);
      }
    }

    // 2. Fallback to env variables (ADMIN_EMAIL & ADMIN_PASSWORD) - only for initial bootstrap if DB is empty
    if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD && env.SESSION_SECRET) {
      if (env.DB) {
        const count = await env.DB.prepare('SELECT count(*) as c FROM admin_users')
          .first<{ c: number }>()
          .catch(() => null);
        if (count && count.c > 0) {
          return false;
        }
      }

      const emailOk = await safeEqual(
        normalizedEmail,
        env.ADMIN_EMAIL.trim().toLowerCase(),
        env.SESSION_SECRET
      );
      const passOk = await safeEqual(password, env.ADMIN_PASSWORD, env.SESSION_SECRET);
      return emailOk && passOk;
    }

    return false;
  },

  async createToken(env: Env, email: string): Promise<string> {
    const payload: SessionPayload = {
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      jti: crypto.randomUUID().slice(0, 12),
    };
    const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
    const key = await hmacKey(env.SESSION_SECRET, 'sign');
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    return `${body}.${toBase64Url(sig)}`;
  },

  async verifyToken(env: Env, token: string): Promise<SessionPayload | null> {
    const [body, sig] = token.split('.');
    if (!body || !sig || !env.SESSION_SECRET) return null;

    try {
      const key = await hmacKey(env.SESSION_SECRET, 'verify');
      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        fromBase64Url(sig),
        encoder.encode(body)
      );
      if (!valid) return null;

      const payload = JSON.parse(
        new TextDecoder().decode(fromBase64Url(body))
      ) as SessionPayload;
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  },

  async getAccount(env: Env, currentEmail: string) {
    if (env.DB) {
      // Always return the authoritative single admin from D1 database
      const user = await env.DB.prepare(
        'SELECT id, email, role, created_at FROM admin_users LIMIT 1'
      ).first<{ id: string; email: string; role: string; created_at: string }>();

      if (user) {
        return {
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        };
      }
    }
    return {
      email: currentEmail,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
  },

  async updateAccount(
    env: Env,
    currentEmail: string,
    payload: { currentPassword: string; newEmail?: string; newPassword?: string }
  ) {
    if (!payload.currentPassword) {
      throw new HttpError(400, 'Current password is required to verify identity.');
    }

    const isCurrentOk = await this.verifyCredentials(env, currentEmail, payload.currentPassword);
    if (!isCurrentOk) {
      throw new HttpError(401, 'Current password is incorrect.');
    }

    const updatedEmail = payload.newEmail ? payload.newEmail.trim().toLowerCase() : currentEmail.trim().toLowerCase();

    if (env.DB) {
      // Check if newEmail is already taken by another account
      if (payload.newEmail && payload.newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
        const existing = await env.DB.prepare(
          'SELECT id FROM admin_users WHERE lower(email) = ? AND lower(email) != ?'
        )
          .bind(updatedEmail, currentEmail.toLowerCase())
          .first();
        if (existing) {
          throw new HttpError(409, 'An account with that email already exists.');
        }
      }

      // Find user by email or fallback to first admin account (usr_admin_default)
      const targetUser = await env.DB.prepare(
        'SELECT id FROM admin_users WHERE lower(email) = ? LIMIT 1'
      )
        .bind(currentEmail.toLowerCase())
        .first<{ id: string }>();

      const targetId = targetUser?.id || 'usr_admin_default';

      if (payload.newPassword) {
        const newHash = await sha256Hex(payload.newPassword);
        const updateRes = await env.DB.prepare(
          'UPDATE admin_users SET email = ?, password_hash = ? WHERE id = ?'
        )
          .bind(updatedEmail, newHash, targetId)
          .run();

        if (!updateRes.meta.changes) {
          await env.DB.prepare(
            'INSERT INTO admin_users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
          )
            .bind(targetId, updatedEmail, newHash, 'admin')
            .run();
        }
      } else if (payload.newEmail) {
        const updateRes = await env.DB.prepare(
          'UPDATE admin_users SET email = ? WHERE id = ?'
        )
          .bind(updatedEmail, targetId)
          .run();

        if (!updateRes.meta.changes) {
          const currentHash = await sha256Hex(payload.currentPassword);
          await env.DB.prepare(
            'INSERT INTO admin_users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
          )
            .bind(targetId, updatedEmail, currentHash, 'admin')
            .run();
        }
      }

      // Automatically migrate any enrolled passkeys to the new email
      if (payload.newEmail && payload.newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
        try {
          await env.DB.prepare(
            'UPDATE passkeys SET user_id = ? WHERE lower(user_id) = ?'
          )
            .bind(updatedEmail, currentEmail.toLowerCase())
            .run();
        } catch {
          // ignore if passkeys table doesn't exist
        }
      }
    }

    const token = await this.createToken(env, updatedEmail);
    return {
      email: updatedEmail,
      token,
      message: 'Account credentials updated successfully.',
    };
  },
};
