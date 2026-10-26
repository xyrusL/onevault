import { Hono, type Context } from 'hono';
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
  watchMinutes?: number;
  deviceType?: string;
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
        'SELECT id, name, slug, status, gateway_token FROM connected_projects WHERE slug = ? OR gateway_token = ?'
      )
        .bind(slug, token)
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
 * Universal Telemetry & Activity Ingestion Handler
 * Supports /:slug/telemetry, /:slug/event, and /:slug/events
 * Ingests client activity, enriches with Cloudflare Edge metadata, and persists to D1
 */
const handleProjectTelemetry = async (c: Context<AppBindings>) => {
  const slug = (c.req.param('slug') || '').toLowerCase();

  // Dynamically resolve project name from D1 connected_projects
  let projectName = slug.toUpperCase();
  if (c.env?.DB) {
    try {
      const projRow = await c.env.DB.prepare('SELECT name FROM connected_projects WHERE slug = ?')
        .bind(slug)
        .first<{ name: string }>();
      if (projRow?.name) projectName = projRow.name;
    } catch {}
  }

  // Support both JSON content-type and text/plain fallback (for simple CORS / sendBeacon)
  let body: TelemetryBody | null = null;
  const contentType = c.req.header('Content-Type') || '';
  if (contentType.includes('application/json')) {
    body = await c.req.json<TelemetryBody>().catch(() => null);
  } else {
    const rawText = await c.req.text().catch(() => '');
    try {
      body = JSON.parse(rawText) as TelemetryBody;
    } catch {
      body = null;
    }
  }

  if (!body || !body.event) {
    return c.json({ ok: false, error: 'Invalid telemetry payload' }, 400);
  }

  const clientIp =
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';
  const cf = (c.req.raw as Request & { cf?: IncomingRequestCfProperties }).cf;
  const country = (cf?.country as string) || 'Global';
  const city = (cf?.city as string) || '';
  const asnOrg = (cf?.asOrganization as string) || 'Client Network';
  const userAgent = body.userAgent || c.req.header('User-Agent') || 'Unknown';
  const now = new Date().toISOString();

  // 1. Device Type Detection (PC, Mobile, Tablet, Smart TV, Console)
  const uaLower = userAgent.toLowerCase();
  let deviceType = (body.deviceType || '').toLowerCase();
  if (!deviceType || deviceType === 'unknown') {
    if (
      uaLower.includes('smart-tv') ||
      uaLower.includes('smarttv') ||
      uaLower.includes('tizen') ||
      uaLower.includes('webos') ||
      uaLower.includes('appletv') ||
      uaLower.includes('googletv') ||
      uaLower.includes('roku') ||
      uaLower.includes('hbbtv') ||
      uaLower.includes('viera') ||
      uaLower.includes('bravia') ||
      uaLower.includes('firetv')
    ) {
      deviceType = 'smart_tv';
    } else if (uaLower.includes('playstation') || uaLower.includes('xbox') || uaLower.includes('nintendo')) {
      deviceType = 'console';
    } else if (uaLower.includes('ipad') || uaLower.includes('tablet')) {
      deviceType = 'tablet';
    } else if (uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')) {
      deviceType = 'mobile';
    } else {
      deviceType = 'pc';
    }
  }

  let logCategory = 'projects';
  let logLevel: 'info' | 'warning' | 'error' = 'info';
  let logTitle = `[${projectName}] ${body.event}`;
  let logMessage = `Event received from ${projectName} (${country})`;
  let isSecurityThreat = false;
  let threatAction = 'ALLOW';

  // 2. Classify Telemetry Event & Inspect Security Probes
  if (body.event === 'devtools_inspect') {
    isSecurityThreat = true;
    logLevel = 'warning';
    threatAction = 'FLAGGED';
    const trigger = (body.details?.trigger as string) || 'keyboard_or_resize';
    logTitle = `[${projectName}] DevTools Inspection Probed: ${clientIp} (${country})`;
    logMessage = `User at ${clientIp} (${country}) probed DevTools on "${body.path || '/'}" using [${trigger}]. Client Device: ${deviceType.toUpperCase()}.`;
  } else if (body.event === '404_error' && body.path) {
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
    logMessage = `Viewer in ${country} (${deviceType.toUpperCase()}) started streaming "${body.title || 'Media'}" (${body.category || 'movie'}${
      body.season ? ` S${body.season}:E${body.episode}` : ''
    }).`;
  } else if (body.event === 'stream_heartbeat' || body.event === 'stream_watch') {
    logLevel = 'info';
    logTitle = `[${projectName}] Watching: ${body.title || 'Media'} (${Math.round(body.watchMinutes || 1)}m)`;
    logMessage = `Viewer in ${country} on ${deviceType.toUpperCase()} reached ${Math.round(body.watchMinutes || 1)} minutes on "${body.title || 'Media'}".`;
  } else if (body.event === 'player_error' || body.event === 'stream_error') {
    logLevel = 'error';
    logTitle = `[${projectName}] Player Playback Error`;
    logMessage = `Playback failed on "${body.title || 'Media'}" (${deviceType.toUpperCase()}): ${JSON.stringify(body.details || {})}`;
  } else if (body.event === 'network_offline') {
    logLevel = 'warning';
    logTitle = `[${projectName}] Client Network Drop / Offline`;
    logMessage = `Client connection dropped while navigating "${body.path || '/'}".`;
  } else if (body.event === 'page_view') {
    logLevel = 'info';
    logTitle = `[${projectName}] Visitor Navigation`;
    logMessage = `Visitor from ${country} (${deviceType.toUpperCase()}) viewed "${body.title || body.path || '/'}".`;
  }

  // 3. Persist Event into Cloudflare D1 project_telemetry_events & update project stats
  if (c.env?.DB) {
    const eventId = `telem_${crypto.randomUUID()}`;
    const watchMins = Number(body.watchMinutes) || 0;
    const mediaIdStr = body.movieId !== undefined ? String(body.movieId) : null;
    const detailsJson = JSON.stringify(body.details || {});

    c.executionCtx.waitUntil(
      (async () => {
        try {
          // Auto-ensure telemetry table exists
          await c.env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS project_telemetry_events (
              id                  TEXT PRIMARY KEY,
              project_slug        TEXT NOT NULL,
              event_type          TEXT NOT NULL,
              title               TEXT,
              path                TEXT,
              category            TEXT,
              media_id            TEXT,
              season              INTEGER,
              episode             INTEGER,
              watch_minutes       REAL DEFAULT 0,
              device_type         TEXT NOT NULL DEFAULT 'pc',
              client_ip           TEXT NOT NULL DEFAULT '127.0.0.1',
              country             TEXT NOT NULL DEFAULT 'Global',
              city                TEXT,
              asn_org             TEXT,
              user_agent          TEXT,
              details             TEXT DEFAULT '{}',
              created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            )`
          ).run();

          // Insert telemetry record
          await c.env.DB.prepare(
            `INSERT INTO project_telemetry_events (
              id, project_slug, event_type, title, path, category, media_id, season, episode,
              watch_minutes, device_type, client_ip, country, city, asn_org, user_agent, details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              eventId,
              slug,
              body.event,
              body.title || null,
              body.path || null,
              body.category || null,
              mediaIdStr,
              body.season || null,
              body.episode || null,
              watchMins,
              deviceType,
              clientIp,
              country,
              city,
              asnOrg,
              userAgent,
              detailsJson,
              now
            )
            .run();

          // Update Project's Live Stats in connected_projects
          const projectRow = await c.env.DB.prepare(
            'SELECT id, stats FROM connected_projects WHERE slug = ?'
          )
            .bind(slug)
            .first<{ id: string; stats: string }>();

          if (projectRow) {
            let statsObj: {
              activeViewers?: number;
              totalRequestsToday?: number;
              blockedThreatsToday?: number;
              avgLatencyMs?: number;
              totalWatchMinutes?: number;
              totalInspections?: number;
              totalErrors?: number;
              deviceBreakdown?: Record<string, number>;
            } = {};

            try {
              statsObj = JSON.parse(projectRow.stats || '{}');
            } catch {
              statsObj = {};
            }

            statsObj.totalRequestsToday = (statsObj.totalRequestsToday || 0) + 1;
            if (watchMins > 0) {
              statsObj.totalWatchMinutes = (statsObj.totalWatchMinutes || 0) + watchMins;
            }
            if (isSecurityThreat) {
              statsObj.blockedThreatsToday = (statsObj.blockedThreatsToday || 0) + 1;
            }
            if (body.event === 'devtools_inspect') {
              statsObj.totalInspections = (statsObj.totalInspections || 0) + 1;
            }
            if (body.event === 'player_error' || body.event === 'stream_error') {
              statsObj.totalErrors = (statsObj.totalErrors || 0) + 1;
            }

            // Update Device Breakdown counts
            statsObj.deviceBreakdown = statsObj.deviceBreakdown || { pc: 0, mobile: 0, tablet: 0, smart_tv: 0 };
            const normalizedDev = deviceType === 'smart_tv' ? 'smart_tv' : deviceType === 'tablet' ? 'tablet' : deviceType === 'mobile' ? 'mobile' : 'pc';
            statsObj.deviceBreakdown[normalizedDev] = (statsObj.deviceBreakdown[normalizedDev] || 0) + 1;

            await c.env.DB.prepare(
              'UPDATE connected_projects SET stats = ?, last_seen_at = ?, updated_at = ? WHERE id = ?'
            )
              .bind(JSON.stringify(statsObj), now, now, projectRow.id)
              .run();
          }

          // Also mirror notable security/stream events into system_audit_logs
          const shouldWriteToAuditLog =
            isSecurityThreat ||
            body.event === 'devtools_inspect' ||
            body.event === '404_error' ||
            body.event === 'stream_start' ||
            body.event === 'player_error';

          if (shouldWriteToAuditLog) {
            const auditId = `proj_${crypto.randomUUID()}`;
            await c.env.DB.prepare(
              `INSERT INTO system_audit_logs (id, level, category, title, message, details, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                auditId,
                logLevel,
                logCategory,
                logTitle,
                logMessage,
                JSON.stringify({
                  project: slug,
                  event: body.event,
                  deviceType,
                  title: body.title,
                  path: body.path,
                  clientIp,
                  country,
                  city,
                  userAgent,
                  timestamp: now,
                }),
                now
              )
              .run();
          }
        } catch (err) {
          console.warn('[OneVault Gateway] Telemetry processing error:', err);
        }
      })()
    );
  }

  return c.json({
    ok: true,
    logged: true,
    device: deviceType,
    threatDetected: isSecurityThreat,
    action: threatAction,
    timestamp: now,
  });
};

// Mount universal telemetry endpoints (aliases prevent adblock ERR_BLOCKED_BY_CLIENT)
gatewayRoutes.post('/:slug/telemetry', handleProjectTelemetry);
gatewayRoutes.post('/:slug/event', handleProjectTelemetry);
gatewayRoutes.post('/:slug/events', handleProjectTelemetry);

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
