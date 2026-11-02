import type { MiddlewareHandler } from 'hono';
import { authService } from '../services/auth.service';
import { edgeDefenseService } from '../services/edge-defense.service';
import type { AppBindings } from '../types/env.types';

/** Rejects any /api request without a valid signed session token (and enforces Single-Device Session Pin when active). */
export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const origin = new URL(c.req.url).origin;

  const session = token ? await authService.verifyToken(c.env, token) : null;
  if (!session) {
    return c.json(
      {
        ok: false,
        status: 401,
        error: 'Unauthorized: Administrator Session Required',
        message:
          'This endpoint requires an authenticated OneVault administrator session. Please sign in or provide a valid Authorization Bearer token.',
        loginUrl: `${origin}/api/auth/login`,
        help:
          'If you are integrating a connected project (e.g. streaming frontend like GIGAMAXX), use the public project endpoints under /api/projects/:slug/events and /api/projects/:slug/handshake with your X-OneVault-Token header.',
        apiGuide: `${origin}/api`,
      },
      401
    );
  }

  const isPinnedOk = edgeDefenseService.verifyDeviceSessionPin(
    token,
    c.req.header('User-Agent')
  );
  if (!isPinnedOk) {
    return c.json(
      {
        ok: false,
        status: 401,
        error: 'Unauthorized: Session Revoked (Device Pin Lock)',
        message:
          'Session revoked: Single-Device Self-Defense Lock is active on the primary device. Please re-authenticate on this device.',
        loginUrl: `${origin}/api/auth/login`,
      },
      401
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

