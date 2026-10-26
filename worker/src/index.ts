import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleIncomingEmail } from './handlers/email.handler';
import { HttpError } from './lib/http-error';
import { requireAuth } from './middleware/require-auth.middleware';
import { authRoutes } from './routes/auth.routes';
import { backupRoutes } from './routes/backup.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { domainsRoutes } from './routes/domains.routes';
import { forwardTargetsRoutes } from './routes/forward-targets.routes';
import { gatewayRoutes } from './routes/gateway.routes';
import { mailInboxRoutes } from './routes/mail-inbox.routes';
import { mailRoutes } from './routes/mail.routes';
import { notesRoutes } from './routes/notes.routes';
import { projectsRoutes } from './routes/projects.routes';
import { twoFactorRoutes } from './routes/two-factor.routes';
import { edgeDefenseService } from './services/edge-defense.service';
import { threatGuardService } from './services/threat-guard.service';
import type { AppBindings, Env } from './types/env.types';

/**
 * onevault-worker entry point.
 *  - fetch : JSON API under /api/* (the React site itself is served from static assets)
 *  - email : Cloudflare Email Routing handler
 *
 * Add a new feature by creating routes/<feature>.routes.ts + services/<feature>.service.ts
 * and mounting it below.
 */
const app = new Hono<AppBindings>();

// Enable CORS for external frontends (Vercel, custom domains, local development)
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  })
);

// Security basic + Adaptive Threat Guard (IPS) + Edge DDoS Self-Defense Shield
app.use('*', async (c, next) => {
  // 1. Adaptive Threat Guard (Behavioral IPS): per-actor route-scanner, canary honeypot, and exploit payload inspection
  threatGuardService.inspectIncomingRequest(c);

  const url = new URL(c.req.url);
  const pathname = decodeURIComponent(url.pathname);

  // Block path traversal and hidden files / dot segments (allowing standard RFC 8615 /.well-known/)
  if (pathname.includes('..') || (/(?:^|\/)\.[^/]/.test(pathname) && !pathname.startsWith('/.well-known/'))) {
    throw new HttpError(403, 'Access denied: hidden or restricted URL.');
  }

  // Block probing known sensitive or hidden prefixes
  const lowerPath = pathname.toLowerCase();
  const hiddenPrefixes = ['/api/private', '/api/internal', '/api/secret', '/.env', '/.git', '/admin/secret'];
  if (hiddenPrefixes.some((prefix) => lowerPath.startsWith(prefix))) {
    throw new HttpError(403, 'Access denied: hidden endpoint.');
  }

  // 2. Enforce Edge Self-Defense (Bot Scrubber, 64KB D1 Write-Path Circuit Breaker, Sliding-Window IP Rate Limiter)
  edgeDefenseService.enforceIncomingShield(c);

  await next();

  // Basic security headers
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
});

// WebAuthn Related Origins manifest (allows cross-domain passkey sharing between ainxe.com and dezely.com)
app.get('/.well-known/webauthn', (c) => {
  return c.json({
    origins: [
      'https://onevault.ainxe.com',
      'https://onevault.dezely.com',
    ],
  });
});

// Public
app.route('/api/auth', authRoutes);
app.route('/api/gateway', gatewayRoutes);

// Everything below requires a signed session token
app.use('/api/*', requireAuth);
app.route('/api/backup', backupRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/domains', domainsRoutes);
app.route('/api/forward-targets', forwardTargetsRoutes);
app.route('/api/mail', mailRoutes);
app.route('/api/mail-inbox', mailInboxRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/two-factor', twoFactorRoutes);

// Automatically discover and enroll all mounted `/api/*` routes in both the 5-Layer Self-Defense Engine & Adaptive Threat Guard
edgeDefenseService.registerMountedRoutes(app.routes);
threatGuardService.registerSafeApiPrefixes(app.routes);

app.onError((err, c) => {
  const isHttpError = err instanceof HttpError;
  const status = isHttpError ? (err.status as number) : 500;
  const message = err.message || 'An unexpected error occurred.';

  // Asynchronously log warnings and errors into D1 audit logs with accurate route category
  try {
    // Skip logging routine 401 Unauthorized session probes as system alerts
    if (c.env?.DB && status !== 401) {
      const logId = `err_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const details = err.stack ? err.stack.slice(0, 500) : null;
      const reqPath = new URL(c.req.url).pathname.toLowerCase();
      let category = 'system';
      if (reqPath.startsWith('/api/notes')) category = 'notes';
      else if (reqPath.startsWith('/api/mail') || reqPath.startsWith('/api/forward-targets')) category = 'mail';
      else if (reqPath.startsWith('/api/two-factor') || reqPath.startsWith('/api/2fa')) category = 'two_factor';
      else if (reqPath.startsWith('/api/auth')) category = 'auth';
      else if (reqPath.startsWith('/api/backup')) category = 'backup';
      else if (reqPath.startsWith('/api/domains')) category = 'system';

      // Determine appropriate title & level
      let title = isHttpError ? `HTTP ${status} Alert` : 'System Runtime Error';
      let auditLevel: 'info' | 'warning' | 'error' = status >= 500 ? 'error' : 'warning';

      if (message.includes('Adaptive Threat Guard')) {
        title = status === 403 ? 'Threat Intercepted (403 Block)' : 'Rate-Limit Intercepted (429)';
        auditLevel = status === 403 ? 'error' : 'warning';
      }

      c.executionCtx.waitUntil(
        c.env.DB.prepare(
          `INSERT INTO system_audit_logs (id, level, category, title, message, details, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(logId, auditLevel, category, title, message, details, now)
          .run()
          .catch(() => {})
      );
    }
  } catch {
    // Ignore logging failures to guarantee client response
  }

  if (isHttpError) {
    return c.json({ error: err.message }, err.status as 400);
  }
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default {
  fetch: app.fetch,
  email: (message: ForwardableEmailMessage, env: Env) =>
    handleIncomingEmail(message, env),
} satisfies ExportedHandler<Env>;
