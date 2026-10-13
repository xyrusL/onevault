import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { requireAuth } from '../middleware/require-auth.middleware';
import { authService } from '../services/auth.service';
import { edgeDefenseService } from '../services/edge-defense.service';
import { threatGuardService } from '../services/threat-guard.service';
import type { AppBindings } from '../types/env.types';

import { passkeyService } from '../services/passkey.service';

export const authRoutes = new Hono<AppBindings>();

/**
 * Public Passkey Endpoints
 */
authRoutes.get('/passkey/status', async (c) => {
  const hasPasskeys = await passkeyService.hasAnyPasskey(c.env);
  return c.json({ hasPasskeys });
});

authRoutes.post('/passkey/login-options', async (c) => {
  const origin = c.req.header('origin');
  const host = c.req.header('host');
  const rpInfo = passkeyService.getRPInfo(origin, host, c.req.url);

  const options = await passkeyService.generateLoginOptions(c.env, rpInfo);
  return c.json(options);
});

authRoutes.post('/passkey/login-verify', async (c) => {
  const body = await c.req.json<{ response: any }>().catch(() => ({ response: null }));
  if (!body.response) {
    throw new HttpError(400, 'Invalid passkey assertion response.');
  }

  const origin = c.req.header('origin');
  const host = c.req.header('host');
  const rpInfo = passkeyService.getRPInfo(origin, host, c.req.url);

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const { email, passkeyName } = await passkeyService.verifyLogin(
    c.env,
    { response: body.response },
    rpInfo
  );

  // Clear threat guard on successful passkey login
  threatGuardService.resetActorProfile(clientIp);

  const token = await authService.createToken(c.env, email);
  edgeDefenseService.pinNewDeviceToken(token, c.req.header('User-Agent'));

  return c.json({
    token,
    email,
    passkeyName,
    message: `Signed in with passkey "${passkeyName}".`,
  });
});

/**
 * Authenticated Passkey Endpoints
 */
authRoutes.get('/passkey/list', requireAuth, async (c) => {
  const email = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';
  const passkeys = await passkeyService.listPasskeys(c.env, email);
  return c.json(passkeys);
});

authRoutes.post('/passkey/register-options', requireAuth, async (c) => {
  const email = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';
  const origin = c.req.header('origin');
  const host = c.req.header('host');
  const rpInfo = passkeyService.getRPInfo(origin, host, c.req.url);

  const options = await passkeyService.generateRegistrationOptions(c.env, email, rpInfo);
  return c.json(options);
});

authRoutes.post('/passkey/register-verify', requireAuth, async (c) => {
  const email = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';
  const body = await c.req
    .json<{ response: any; name?: string }>()
    .catch(() => ({ response: null, name: '' }));

  if (!body.response) {
    throw new HttpError(400, 'Invalid passkey registration credential payload.');
  }

  const origin = c.req.header('origin');
  const host = c.req.header('host');
  const rpInfo = passkeyService.getRPInfo(origin, host, c.req.url);
  const userAgent = c.req.header('User-Agent') || undefined;

  const result = await passkeyService.verifyRegistration(
    c.env,
    email,
    { response: body.response, name: body.name, userAgent },
    rpInfo
  );

  return c.json(result);
});

authRoutes.delete('/passkey/:id', requireAuth, async (c) => {
  const email = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';
  const credentialId = c.req.param('id');
  if (!credentialId) {
    throw new HttpError(400, 'Credential ID is required.');
  }

  await passkeyService.deletePasskey(c.env, email, credentialId);
  return c.json({ success: true, message: 'Passkey removed successfully.' });
});

authRoutes.post('/login', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({}) as { email?: string; password?: string });

  if (!body.email || !body.password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';
  const cf = (c.req.raw as Request & { cf?: IncomingRequestCfProperties }).cf;

  const ok = await authService.verifyCredentials(c.env, body.email, body.password);
  if (!ok) {
    const decision = threatGuardService.recordBehavioralEvent({
      ip: clientIp,
      countryCode: (cf?.country as string) || 'PH',
      asnOrg: (cf?.asOrganization as string) || 'Client ISP',
      userAgent: c.req.header('User-Agent') || 'Browser',
      pathname: '/api/auth/login',
      isFailedLogin: true,
    });
    if (decision.action === 'TEMP_QUARANTINE') {
      throw new HttpError(
        403,
        `Adaptive Threat Guard Quarantine: ${decision.detectionVector}. Login temporarily locked for 10 minutes.`
      );
    }
    if (decision.action === 'RATE_LIMITED') {
      throw new HttpError(
        429,
        `Adaptive Threat Guard Rate-Limit: ${decision.detectionVector}. Please wait before retrying.`
      );
    }
    throw new HttpError(401, 'Invalid email or password.');
  }

  // Once admin credentials are verified valid, immediately clear any quarantine or penalty
  // on this IP so the admin can always enter without false lockout!
  threatGuardService.resetActorProfile(clientIp);

  const token = await authService.createToken(c.env, body.email.trim().toLowerCase());
  // Automatically pin the newly authenticated device and invalidate any older device tokens
  edgeDefenseService.pinNewDeviceToken(token, c.req.header('User-Agent'));
  return c.json({ token, email: body.email.trim().toLowerCase() });
});

/**
 * POST /api/auth/route-probe — Receives SPA Route-Scanner / Unknown Route telemetry from the frontend
 * and evaluates whether the client is making a harmless human typo (1–3 forgiven) or scanning pages.
 */
authRoutes.post('/route-probe', async (c) => {
  const body = await c.req
    .json<{ pathname?: string; isAuthenticated?: boolean }>()
    .catch(() => ({}) as { pathname?: string; isAuthenticated?: boolean });

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';
  const cf = (c.req.raw as Request & { cf?: IncomingRequestCfProperties }).cf;

  const decision = threatGuardService.recordBehavioralEvent({
    ip: clientIp,
    countryCode: (cf?.country as string) || 'PH',
    asnOrg: (cf?.asOrganization as string) || 'Client ISP',
    userAgent: c.req.header('User-Agent') || 'Browser',
    pathname: body.pathname || '/unknown',
    isUnknown404Route: true,
    isAuthenticated: Boolean(body.isAuthenticated),
  });

  return c.json(decision);
});

authRoutes.get('/account', requireAuth, async (c) => {
  const email = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';
  const account = await authService.getAccount(c.env, email);
  return c.json(account);
});

authRoutes.patch('/account', requireAuth, async (c) => {
  const currentEmail = c.get('userEmail') || c.env.ADMIN_EMAIL || 'admin@admin.com';
  const body = await c.req
    .json<{
      currentPassword?: string;
      newEmail?: string;
      newPassword?: string;
    }>()
    .catch(() => ({} as { currentPassword?: string; newEmail?: string; newPassword?: string }));

  if (!body.currentPassword) {
    throw new HttpError(400, 'Current password is required.');
  }

  const result = await authService.updateAccount(c.env, currentEmail, {
    currentPassword: body.currentPassword,
    newEmail: body.newEmail,
    newPassword: body.newPassword,
  });

  return c.json(result);
});
