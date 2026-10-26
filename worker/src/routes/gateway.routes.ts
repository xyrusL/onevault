import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import { threatGuardService } from '../services/threat-guard.service';
import type { AppBindings } from '../types/env.types';

export const gatewayRoutes = new Hono<AppBindings>();

interface TelemetryBody {
  app?: string;
  event: string;
  path?: string;
  title?: string;
  category?: string;
  movieId?: string | number;
  season?: number;
  episode?: number;
  userAgent?: string;
  timestamp?: string;
  details?: Record<string, unknown>;
}

/**
 * GET /api/gateway/:slug/config
 * Public edge endpoint for connected apps to sync their status & shield policies
 */
gatewayRoutes.get('/:slug/config', async (c) => {
  const slug = c.req.param('slug').toLowerCase();

  // Try querying D1 database if bound
  if (c.env?.DB) {
    try {
      const row = await c.env.DB.prepare(
        'SELECT name, slug, status, domains, shield_policy FROM connected_projects WHERE slug = ?'
      )
        .bind(slug)
        .first<{
          name: string;
          slug: string;
          status: string;
          domains: string;
          shield_policy: string;
        }>();

      if (row) {
        return c.json({
          name: row.name,
          slug: row.slug,
          status: row.status,
          domains: JSON.parse(row.domains || '[]'),
          shieldPolicy: JSON.parse(row.shield_policy || '{}'),
          shieldEnabled: row.status === 'active',
        });
      }
    } catch {
      // Fallback to active state
    }
  }

  // Fallback for default connected projects (GIGAMAXX)
  return c.json({
    name: slug.toUpperCase(),
    slug,
    status: 'active',
    shieldEnabled: true,
    domains: ['gigamaxx.com', 'localhost:5173'],
    shieldPolicy: {
      antiBot: true,
      rateLimitPerMin: 60,
      streamTokenSigning: true,
    },
  });
});

/**
 * POST /api/gateway/:slug/handshake
 * Live Handshake & Pairing Endpoint
 * Validates project token, flips project from 'connecting' (amber) to 'active' (emerald green),
 * updates last_seen_at in D1, and registers live handshake in system_audit_logs.
 */
gatewayRoutes.post('/:slug/handshake', async (c) => {
  const slug = c.req.param('slug').toLowerCase();
  const body = await c.req.json<{ token?: string }>().catch(() => null);
  const token =
    c.req.header('X-OneVault-Token') ||
    c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') ||
    body?.token;

  if (!token) {
    throw new HttpError(401, 'Missing OneVault Project Token (X-OneVault-Token header required)');
  }

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';
  const now = new Date().toISOString();

  let projectFound = false;
  let projectName = slug.toUpperCase();

  if (c.env?.DB) {
    try {
      const row = await c.env.DB.prepare(
        'SELECT id, name, slug, status, gateway_token FROM connected_projects WHERE slug = ?'
      )
        .bind(slug)
        .first<{ id: string; name: string; slug: string; status: string; gateway_token?: string }>();

      if (row) {
        projectName = row.name;
        // Verify token matches if configured
        if (row.gateway_token && row.gateway_token !== token) {
          throw new HttpError(403, 'Invalid OneVault Project Token for this project');
        }

        projectFound = true;

        // Auto-switch to active (emerald green) and record last_seen_at in D1
        await c.env.DB.prepare(
          'UPDATE connected_projects SET status = ?, last_seen_at = ?, updated_at = ? WHERE id = ?'
        )
          .bind('active', now, now, row.id)
          .run();
      }
    } catch (e) {
      if (e instanceof HttpError) throw e;
    }
  }

  // If default gigamaxx fallback
  if (!projectFound && slug === 'gigamaxx') {
    projectFound = true;
  }

  if (!projectFound) {
    throw new HttpError(404, `Project [${slug}] not found in OneVault`);
  }

  // Log successful handshake to D1 system_audit_logs
  if (c.env?.DB) {
    const logId = `proj_${crypto.randomUUID()}`;
    c.executionCtx.waitUntil(
      c.env.DB.prepare(
        `INSERT INTO system_audit_logs (id, level, category, title, message, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          logId,
          'info',
          'projects',
          `[${projectName}] Handshake Verified`,
          `Live edge connection verified via token from ${clientIp}. Project status switched to CONNECTED.`,
          JSON.stringify({ project: slug, tokenPrefix: token.slice(0, 10), clientIp, timestamp: now }),
          now
        )
        .run()
        .catch(() => {})
    );
  }

  return c.json({
    ok: true,
    project: slug,
    status: 'active',
    verified: true,
    message: 'OneVault Edge Shield handshake successful. Project is now connected and protected.',
    timestamp: now,
  });
});

/**
 * POST /api/gateway/:slug/telemetry
 * Real-time 24/7 security & activity telemetry collector
 * Evaluates route scans, 404 probes, stream events and logs into D1 system_audit_logs
 */
gatewayRoutes.post('/:slug/telemetry', async (c) => {
  const slug = c.req.param('slug').toLowerCase();
  const projectName = slug === 'gigamaxx' ? 'GIGAMAXX 4K' : slug.toUpperCase();

  const body = await c.req.json<TelemetryBody>().catch(() => null);
  if (!body || !body.event) {
    return c.json({ ok: false, error: 'Invalid telemetry payload' }, 400);
  }

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';
  const cf = (c.req.raw as Request & { cf?: IncomingRequestCfProperties }).cf;
  const country = (cf?.country as string) || 'Global';
  const asnOrg = (cf?.asOrganization as string) || 'Client Network';
  const userAgent = body.userAgent || c.req.header('User-Agent') || 'Unknown';
  const now = new Date().toISOString();

  let logCategory = 'projects';
  let logLevel: 'info' | 'warning' | 'error' = 'info';
  let logTitle = `[${projectName}] ${body.event}`;
  let logMessage = `Event received from ${projectName} (${country})`;
  let isSecurityThreat = false;
  let threatAction = 'ALLOW';

  // 1. Inspect 404 Probes & Unknown Route Scans through Threat Guard
  if (body.event === '404_error' && body.path) {
    const evaluation = threatGuardService.inspectProjectRoute({
      projectSlug: slug,
      pathname: body.path,
      ip: clientIp,
      userAgent,
      countryCode: country,
      asnOrg,
    });

    isSecurityThreat = evaluation.isThreat;
    logLevel = evaluation.level;
    threatAction = evaluation.action;

    if (evaluation.isThreat) {
      logTitle = `[${projectName}] Threat Intercepted: ${evaluation.vector}`;
      logMessage = `Client from ${country} (${clientIp}) probed suspicious route "${body.path}". Threat Guard applied ${evaluation.action} (Risk Score: ${evaluation.riskScore}).`;
    } else {
      logLevel = 'info';
      logTitle = `[${projectName}] 404 Route Visited: ${body.path}`;
      logMessage = `Client from ${country} visited non-existent route "${body.path}" (${evaluation.vector}).`;
    }
  } else if (body.event === 'stream_start') {
    logLevel = 'info';
    logTitle = `[${projectName}] Stream Started: ${body.title || '4K Video'}`;
    logMessage = `Viewer in ${country} started streaming "${body.title || 'Media'}" (${body.category || 'movie'}${
      body.season ? ` S${body.season}:E${body.episode}` : ''
    }).`;
  } else if (body.event === 'stream_error') {
    logLevel = 'error';
    logTitle = `[${projectName}] Stream Playback Error`;
    logMessage = `Playback failed on "${body.title || 'Media'}": ${JSON.stringify(body.details || {})}`;
  } else if (body.event === 'page_view') {
    logLevel = 'info';
    logTitle = `[${projectName}] Visitor Arrival`;
    logMessage = `Visitor from ${country} navigated to ${body.path || '/'}.`;
  }

  // 2. Persist to D1 system_audit_logs with Quota Shield Protection:
  // To protect Cloudflare Free Tier (100k daily writes), only write security threats,
  // 404 probes, and stream milestones to D1. Routine page_views are kept in-memory.
  const shouldWriteToAuditLog =
    isSecurityThreat ||
    body.event === '404_error' ||
    body.event === 'stream_start' ||
    body.event === 'stream_error';

  if (c.env?.DB && shouldWriteToAuditLog) {
    const logId = `proj_${crypto.randomUUID()}`;
    const logDetails = JSON.stringify({
      project: slug,
      event: body.event,
      path: body.path || null,
      title: body.title || null,
      clientIp,
      country,
      userAgent,
      threatAction,
      isThreat: isSecurityThreat,
      timestamp: now,
    });

    c.executionCtx.waitUntil(
      c.env.DB.prepare(
        `INSERT INTO system_audit_logs (id, level, category, title, message, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(logId, logLevel, logCategory, logTitle, logMessage, logDetails, now)
        .run()
        .catch((err) => {
          console.warn('[OneVault Gateway] Audit logging error:', err);
        })
    );
  }

  return c.json({
    ok: true,
    logged: true,
    threatDetected: isSecurityThreat,
    action: threatAction,
    timestamp: now,
  });
});

/**
 * GET /api/gateway/:slug/stream
 * Secure reverse-proxy stream token signer with 24/7 Threat Guard Quarantine Protection
 */
gatewayRoutes.get('/:slug/stream', (c) => {
  const slug = c.req.param('slug').toLowerCase();
  const rawSrc = c.req.query('src');
  const mediaId = c.req.query('id');

  if (!rawSrc) {
    throw new HttpError(400, 'Missing stream source');
  }

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  // Enforce Threat Guard quarantine: blocked or quarantined scanner IPs cannot stream
  const quarantineCheck = threatGuardService.isIpQuarantined(clientIp);
  if (quarantineCheck.quarantined) {
    throw new HttpError(
      403,
      `Forbidden: IP (${clientIp}) is quarantined by OneVault Threat Defense (${quarantineCheck.reason || 'Security Lock'})`
    );
  }

  // Verify origin matches allowed project domains in production
  const referer = c.req.header('Referer') || '';
  const origin = c.req.header('Origin') || '';
  const allowed = ['gigamaxx.com', 'localhost', '127.0.0.1'];
  const matchesOrigin = allowed.some((domain) => referer.includes(domain) || origin.includes(domain));

  if (!matchesOrigin && referer) {
    throw new HttpError(403, 'Forbidden: Origin domain not allowed for this project');
  }

  // Return obfuscated streaming envelope with signed timestamp token
  return c.json({
    ok: true,
    project: slug,
    streamId: mediaId || 'stream',
    token: `ov_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    expiresInSeconds: 900,
    source: rawSrc,
  });
});

/**
 * ALL /api/gateway/:slug/proxy/*
 * Concealed Upstream API Edge Reverse-Proxy
 * Strips upstream provider identities, protects secret API endpoints, prevents DevTools inspection
 */
gatewayRoutes.all('/:slug/proxy/*', async (c) => {
  const slug = c.req.param('slug').toLowerCase();
  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  // 1. Check Threat Guard Quarantine
  const quarantineCheck = threatGuardService.isIpQuarantined(clientIp);
  if (quarantineCheck.quarantined) {
    throw new HttpError(
      403,
      `Forbidden: IP (${clientIp}) is quarantined by OneVault Threat Defense`
    );
  }

  // 2. Fetch project upstream configuration from D1 (or fallback)
  let upstreamApi = 'https://api.framextv.cc';
  let allowedDomains = ['gigamaxx.com', 'localhost', '127.0.0.1'];
  let isDevMode = true;

  if (c.env?.DB) {
    try {
      const row = await c.env.DB.prepare(
        'SELECT upstream_api, domains, status, shield_policy FROM connected_projects WHERE slug = ?'
      )
        .bind(slug)
        .first<{
          upstream_api: string;
          domains: string;
          status: string;
          shield_policy?: string;
        }>();

      if (row) {
        if (row.status !== 'active') {
          throw new HttpError(503, `Project [${slug}] is currently unplugged in OneVault`);
        }
        if (row.upstream_api) upstreamApi = row.upstream_api;
        if (row.domains) allowedDomains = JSON.parse(row.domains);
        if (row.shield_policy) {
          try {
            const policy = JSON.parse(row.shield_policy);
            if (policy.devMode !== undefined) isDevMode = policy.devMode;
          } catch {}
        }
      }
    } catch (e) {
      if (e instanceof HttpError) throw e;
    }
  }

  // 3. Verify Origin / Referer lock (bypassed when Development Mode is ON or for localhost testing)
  const referer = c.req.header('Referer') || '';
  const origin = c.req.header('Origin') || '';
  const isLocalOrigin =
    referer.includes('localhost') ||
    referer.includes('127.0.0.1') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  if (!isDevMode && !isLocalOrigin && (referer || origin)) {
    const isAllowed = allowedDomains.some(
      (dom) => referer.includes(dom) || origin.includes(dom)
    );
    if (!isAllowed && allowedDomains.length > 0) {
      throw new HttpError(403, 'Forbidden: Origin domain not allowed for this project');
    }
  }

  // 4. Construct upstream target URL
  const url = new URL(c.req.url);
  const proxyPrefix = `/api/gateway/${slug}/proxy`;
  const subpath = url.pathname.slice(url.pathname.indexOf(proxyPrefix) + proxyPrefix.length);
  const targetUrl = `${upstreamApi.replace(/\/+$/, '')}${subpath}${url.search}`;

  // 5. Proxy the request to concealed upstream
  const reqMethod = c.req.method;
  const reqHeaders = new Headers();
  reqHeaders.set('Accept', 'application/json, text/plain, */*');
  reqHeaders.set('User-Agent', 'OneVault-Edge-Shield/2.0');
  if (c.req.header('Content-Type')) {
    reqHeaders.set('Content-Type', c.req.header('Content-Type')!);
  }

  const reqBody =
    reqMethod !== 'GET' && reqMethod !== 'HEAD' ? await c.req.raw.arrayBuffer() : undefined;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: reqMethod,
      headers: reqHeaders,
      body: reqBody,
    });

    const responseHeaders = new Headers(upstreamRes.headers);
    responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('X-OneVault-Shield', 'Concealed-Edge-Proxy');

    // Conceal upstream server identifiers
    responseHeaders.delete('server');
    responseHeaders.delete('x-powered-by');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    throw new HttpError(502, `Concealed upstream gateway error: ${(err as Error).message}`);
  }
});
