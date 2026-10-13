import type { MiddlewareHandler } from 'hono';
import { HttpError } from '../lib/http-error';
import { authService } from '../services/auth.service';
import { edgeDefenseService } from '../services/edge-defense.service';
import type { AppBindings } from '../types/env.types';

/** Rejects any /api request without a valid signed session token (and enforces Single-Device Session Pin when active). */
export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  const session = token ? await authService.verifyToken(c.env, token) : null;
  if (!session) throw new HttpError(401, 'Unauthorized');

  const isPinnedOk = edgeDefenseService.verifyDeviceSessionPin(
    token,
    c.req.header('User-Agent')
  );
  if (!isPinnedOk) {
    throw new HttpError(
      401,
      'Session revoked: Single-Device Self-Defense Lock is active on primary device.'
    );
  }

  // Resolve authoritative admin email from D1 database
  let effectiveEmail = session.email;
  if (c.env.DB) {
    try {
      const admin = await c.env.DB.prepare('SELECT email FROM admin_users LIMIT 1').first<{ email: string }>();
      if (admin && admin.email) {
        effectiveEmail = admin.email;
      }
    } catch {
      // fallback to session.email
    }
  }

  c.set('userEmail', effectiveEmail);
  await next();
};

