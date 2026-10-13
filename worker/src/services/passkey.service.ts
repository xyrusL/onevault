import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { HttpError } from '../lib/http-error';
import type { Env } from '../types/env.types';

export interface PasskeyRecord {
  id: string;
  userId: string;
  name: string;
  deviceType?: string;
  backedUp: boolean;
  transports?: string[];
  aaguid?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export const passkeyService = {
  /**
   * Lazily ensure tables exist in case migrations were bypassed in test/dev
   */
  async ensureSchema(env: Env) {
    if (!env.DB) return;
    try {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS passkeys (
          id            TEXT PRIMARY KEY,
          user_id       TEXT NOT NULL,
          name          TEXT NOT NULL,
          public_key    TEXT NOT NULL,
          counter       INTEGER NOT NULL DEFAULT 0,
          device_type   TEXT,
          backed_up     INTEGER NOT NULL DEFAULT 0,
          transports    TEXT,
          aaguid        TEXT,
          user_agent    TEXT,
          created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          last_used_at  TEXT
        )`
      ).run();

      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS passkey_challenges (
          id          TEXT PRIMARY KEY,
          challenge   TEXT NOT NULL,
          user_id     TEXT,
          type        TEXT NOT NULL,
          created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          expires_at  TEXT NOT NULL
        )`
      ).run();
    } catch (err) {
      console.warn('Error verifying passkey schema:', err);
    }
  },

  /**
   * Extract rpID and expectedOrigin from request headers or URL
   */
  getRPInfo(requestOrigin: string | undefined, requestHost: string | undefined, requestUrl: string) {
    const url = new URL(requestUrl);
    let expectedOrigin = requestOrigin;

    if (!expectedOrigin) {
      const proto = url.protocol;
      const host = requestHost || url.host;
      expectedOrigin = `${proto}//${host}`;
    }

    const parsedOrigin = new URL(expectedOrigin);
    // rpID is hostname without protocol or port
    const rpID = parsedOrigin.hostname;

    // Cross-origin allowed origins and RP IDs for OneVault domains (ainxe.com, dezely.com, local)
    const allowedRPIDs = Array.from(
      new Set([
        rpID,
        'onevault.ainxe.com',
        'onevault.dezely.com',
        'ainxe.com',
        'dezely.com',
        'localhost',
        '127.0.0.1',
      ])
    );

    const allowedOrigins = Array.from(
      new Set([
        parsedOrigin.origin,
        'https://onevault.ainxe.com',
        'https://onevault.dezely.com',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ])
    );

    return {
      rpID,
      rpName: 'OneVault',
      origin: parsedOrigin.origin,
      allowedRPIDs,
      allowedOrigins,
    };
  },

  /**
   * Clean up expired challenges
   */
  async cleanExpiredChallenges(env: Env) {
    if (!env.DB) return;
    try {
      await env.DB.prepare(
        `DELETE FROM passkey_challenges WHERE expires_at < (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
      ).run();
    } catch {
      // ignore cleanup errors
    }
  },

  /**
   * Check if any passkey is enrolled in system
   */
  async hasAnyPasskey(env: Env): Promise<boolean> {
    if (!env.DB) return false;
    await this.ensureSchema(env);
    try {
      const row = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM passkeys`
      ).first<{ count: number }>();
      return Boolean(row && row.count > 0);
    } catch {
      return false;
    }
  },

  /**
   * List all enrolled passkeys for the vault
   */
  async listPasskeys(env: Env, _userEmail?: string): Promise<PasskeyRecord[]> {
    if (!env.DB) return [];
    await this.ensureSchema(env);

    // In OneVault, all enrolled passkeys belong to the vault administrator
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, name, device_type, backed_up, transports, aaguid, user_agent, created_at, last_used_at
       FROM passkeys
       ORDER BY created_at DESC`
    ).all<{
      id: string;
      user_id: string;
      name: string;
      device_type: string | null;
      backed_up: number;
      transports: string | null;
      aaguid: string | null;
      user_agent: string | null;
      created_at: string;
      last_used_at: string | null;
    }>();

    return (results || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      deviceType: row.device_type || undefined,
      backedUp: Boolean(row.backed_up),
      transports: row.transports ? JSON.parse(row.transports) : undefined,
      aaguid: row.aaguid || undefined,
      userAgent: row.user_agent || undefined,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at || null,
    }));
  },

  /**
   * Delete / Revoke a specific passkey
   */
  async deletePasskey(env: Env, _userEmail: string, credentialId: string): Promise<boolean> {
    if (!env.DB) throw new HttpError(500, 'Database is not bound.');
    await this.ensureSchema(env);

    const res = await env.DB.prepare(
      `DELETE FROM passkeys WHERE id = ?`
    )
      .bind(credentialId)
      .run();

    if (!res.meta.changes) {
      throw new HttpError(404, 'Passkey not found or already deleted.');
    }
    return true;
  },

  /**
   * Generate registration options (start registration)
   */
  async generateRegistrationOptions(
    env: Env,
    userEmail: string,
    rpInfo: { rpID: string; rpName: string; origin: string }
  ) {
    if (!env.DB) throw new HttpError(500, 'Database is not bound.');
    await this.ensureSchema(env);
    await this.cleanExpiredChallenges(env);

    const normalized = userEmail.trim().toLowerCase();
    const existingPasskeys = await this.listPasskeys(env, normalized);

    const excludeCredentials = existingPasskeys.map((p) => ({
      id: p.id,
      transports: p.transports as any,
    }));

    // Convert user email to byte array for WebAuthn user ID
    const encoder = new TextEncoder();
    const userID = encoder.encode(normalized);

    const options = await generateRegistrationOptions({
      rpName: rpInfo.rpName,
      rpID: rpInfo.rpID,
      userID,
      userName: normalized,
      userDisplayName: normalized,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await env.DB.prepare(
      `INSERT INTO passkey_challenges (id, challenge, user_id, type, expires_at)
       VALUES (?, ?, ?, 'registration', ?)`
    )
      .bind(crypto.randomUUID(), options.challenge, normalized, expiresAt)
      .run();

    return options;
  },

  /**
   * Verify registration response and store passkey
   */
  async verifyRegistration(
    env: Env,
    userEmail: string,
    payload: {
      response: RegistrationResponseJSON;
      name?: string;
      userAgent?: string;
    },
    rpInfo: { rpID: string; origin: string }
  ) {
    if (!env.DB) throw new HttpError(500, 'Database is not bound.');
    await this.ensureSchema(env);

    const normalized = userEmail.trim().toLowerCase();

    // Look up valid challenge for this user
    const challengeRow = await env.DB.prepare(
      `SELECT id, challenge FROM passkey_challenges
       WHERE lower(user_id) = ? AND type = 'registration' AND expires_at >= (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(normalized)
      .first<{ id: string; challenge: string }>();

    if (!challengeRow) {
      throw new HttpError(400, 'Registration session expired or invalid. Please try generating a passkey again.');
    }

    const verification = await verifyRegistrationResponse({
      response: payload.response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: (rpInfo as any).allowedOrigins || rpInfo.origin,
      expectedRPID: (rpInfo as any).allowedRPIDs || rpInfo.rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new HttpError(400, 'WebAuthn verification failed.');
    }

    // Challenge consumed — delete it
    await env.DB.prepare(`DELETE FROM passkey_challenges WHERE id = ?`).bind(challengeRow.id).run();

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo;
    const publicKeyBase64 = isoBase64URL.fromBuffer(credential.publicKey);
    const passkeyName = payload.name?.trim() || 'My Passkey';
    const transportsJson = credential.transports ? JSON.stringify(credential.transports) : null;

    await env.DB.prepare(
      `INSERT INTO passkeys (id, user_id, name, public_key, counter, device_type, backed_up, transports, aaguid, user_agent, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), NULL)`
    )
      .bind(
        credential.id,
        normalized,
        passkeyName,
        publicKeyBase64,
        credential.counter,
        credentialDeviceType,
        credentialBackedUp ? 1 : 0,
        transportsJson,
        aaguid || null,
        payload.userAgent || null
      )
      .run();

    return {
      id: credential.id,
      name: passkeyName,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Generate login authentication options
   */
  async generateLoginOptions(env: Env, rpInfo: { rpID: string; origin: string }) {
    if (!env.DB) throw new HttpError(500, 'Database is not bound.');
    await this.ensureSchema(env);
    await this.cleanExpiredChallenges(env);

    // Discoverable credentials / passkeys can omit allowCredentials or we can provide all registered passkeys
    const options = await generateAuthenticationOptions({
      rpID: rpInfo.rpID,
      userVerification: 'preferred',
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await env.DB.prepare(
      `INSERT INTO passkey_challenges (id, challenge, user_id, type, expires_at)
       VALUES (?, ?, NULL, 'authentication', ?)`
    )
      .bind(crypto.randomUUID(), options.challenge, expiresAt)
      .run();

    return options;
  },

  /**
   * Verify login assertion and return authenticated user email
   */
  async verifyLogin(
    env: Env,
    payload: { response: AuthenticationResponseJSON },
    rpInfo: { rpID: string; origin: string }
  ) {
    if (!env.DB) throw new HttpError(500, 'Database is not bound.');
    await this.ensureSchema(env);

    const credentialId = payload.response.id;

    const passkey = await env.DB.prepare(
      `SELECT id, user_id, name, public_key, counter, transports FROM passkeys WHERE id = ?`
    )
      .bind(credentialId)
      .first<{
        id: string;
        user_id: string;
        name: string;
        public_key: string;
        counter: number;
        transports: string | null;
      }>();

    if (!passkey) {
      throw new HttpError(404, 'Passkey credential not recognized or has been removed from this system.');
    }

    // Find any valid unexpired authentication challenge
    const challenges = await env.DB.prepare(
      `SELECT id, challenge FROM passkey_challenges
       WHERE type = 'authentication' AND expires_at >= (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ORDER BY created_at DESC LIMIT 10`
    ).all<{ id: string; challenge: string }>();

    if (!challenges.results || challenges.results.length === 0) {
      throw new HttpError(400, 'Authentication challenge expired or invalid. Please try signing in again.');
    }

    let verified = false;
    let matchedChallengeId: string | null = null;
    let newCounter = passkey.counter;

    const publicKeyBytes = isoBase64URL.toBuffer(passkey.public_key);
    const parsedTransports = passkey.transports ? JSON.parse(passkey.transports) : undefined;

    // Try matching challenge
    for (const ch of challenges.results) {
      try {
        const verification = await verifyAuthenticationResponse({
          response: payload.response,
          expectedChallenge: ch.challenge,
          expectedOrigin: (rpInfo as any).allowedOrigins || rpInfo.origin,
          expectedRPID: (rpInfo as any).allowedRPIDs || rpInfo.rpID,
          credential: {
            id: passkey.id,
            publicKey: publicKeyBytes,
            counter: passkey.counter,
            transports: parsedTransports,
          },
          requireUserVerification: false,
        });

        if (verification.verified) {
          verified = true;
          matchedChallengeId = ch.id;
          newCounter = verification.authenticationInfo.newCounter;
          break;
        }
      } catch {
        // try next challenge
      }
    }

    if (!verified || !matchedChallengeId) {
      throw new HttpError(401, 'Passkey cryptographic signature verification failed.');
    }

    // Clean up consumed challenge and update counter & last_used_at
    await env.DB.prepare(`DELETE FROM passkey_challenges WHERE id = ?`).bind(matchedChallengeId).run();

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE passkeys SET counter = ?, last_used_at = ? WHERE id = ?`
    )
      .bind(newCounter, now, passkey.id)
      .run();

    // Resolve current administrator email from admin_users
    let userEmail = passkey.user_id;
    const admin = await env.DB.prepare('SELECT email FROM admin_users LIMIT 1')
      .first<{ email: string }>()
      .catch(() => null);
    if (admin && admin.email) {
      userEmail = admin.email;
    }

    return {
      email: userEmail,
      passkeyName: passkey.name,
    };
  },
};
