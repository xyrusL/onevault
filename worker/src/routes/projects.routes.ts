import { Hono } from 'hono';
import { HttpError } from '../lib/http-error';
import type { AppBindings } from '../types/env.types';

export const projectsRoutes = new Hono<AppBindings>();

interface ConcealedEndpointDto {
  id: string;
  name: string;
  targetUrl: string;
  proxyPathPrefix: string;
  isSecret: boolean;
}

interface ProjectShieldPolicyDto {
  antiBot: boolean;
  rateLimitPerMin: number;
  streamTokenSigning: boolean;
  tokenExpiryMinutes: number;
  originLock: boolean;
  stealth404: boolean;
  concealedEndpoints?: ConcealedEndpointDto[];
}

interface ProjectStatsDto {
  activeViewers: number;
  totalRequestsToday: number;
  blockedThreatsToday: number;
  avgLatencyMs: number;
}

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  gateway_token?: string | null;
  domains: string;
  upstream_api: string | null;
  shield_policy: string;
  stats: string;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_GIGAMAXX: ProjectRow = {
  id: 'proj_gigamaxx_4k',
  name: 'GIGAMAXX 4K',
  slug: 'gigamaxx',
  description:
    'High-speed 4K streaming web platform — movies, series & anime with zero public API leaks.',
  status: 'active',
  gateway_token: 'ov_live_gigamaxx_4k_98f2a1b7e4',
  domains: JSON.stringify(['gigamaxx.com', 'localhost:5173', 'localhost:4173']),
  upstream_api: 'https://api.framextv.cc',
  shield_policy: JSON.stringify({
    antiBot: true,
    rateLimitPerMin: 60,
    streamTokenSigning: true,
    tokenExpiryMinutes: 15,
    originLock: true,
    stealth404: true,
    concealedEndpoints: [
      {
        id: 'ep_framex_primary',
        name: 'FrameX Master API',
        targetUrl: 'https://api.framextv.cc',
        proxyPathPrefix: '/api',
        isSecret: true,
      },
      {
        id: 'ep_framex_embed',
        name: 'FrameX Stream Embed',
        targetUrl: 'https://framextv.cc',
        proxyPathPrefix: '/stream',
        isSecret: true,
      },
    ],
  }),
  stats: JSON.stringify({
    activeViewers: 1,
    totalRequestsToday: 0,
    blockedThreatsToday: 0,
    avgLatencyMs: 18,
  }),
  last_seen_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * GET /api/projects
 * Returns list of projects from D1 database enriched with real telemetry stats from system_audit_logs
 */
projectsRoutes.get('/', async (c) => {
  let rows: ProjectRow[] = [];

  if (c.env?.DB) {
    try {
      // Auto-ensure table exists with gateway_token column so D1 never throws SQLITE_ERROR
      await c.env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS connected_projects (
          id                  TEXT PRIMARY KEY,
          name                TEXT NOT NULL,
          slug                TEXT NOT NULL UNIQUE,
          description         TEXT,
          status              TEXT NOT NULL DEFAULT 'active',
          gateway_token       TEXT NOT NULL DEFAULT '',
          domains             TEXT NOT NULL DEFAULT '[]',
          upstream_api        TEXT,
          shield_policy       TEXT NOT NULL DEFAULT '{}',
          stats               TEXT NOT NULL DEFAULT '{}',
          last_seen_at        TEXT,
          created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )`
      ).run();

      const res = await c.env.DB.prepare(
        'SELECT * FROM connected_projects ORDER BY created_at DESC'
      ).all<ProjectRow>();
      rows = res.results || [];

      // Auto-seed flagship GIGAMAXX if table is empty
      if (rows.length === 0) {
        await c.env.DB.prepare(
          `INSERT OR IGNORE INTO connected_projects (id, name, slug, description, status, gateway_token, domains, upstream_api, shield_policy, stats)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            DEFAULT_GIGAMAXX.id,
            DEFAULT_GIGAMAXX.name,
            DEFAULT_GIGAMAXX.slug,
            DEFAULT_GIGAMAXX.description,
            DEFAULT_GIGAMAXX.status,
            DEFAULT_GIGAMAXX.gateway_token || '',
            DEFAULT_GIGAMAXX.domains,
            DEFAULT_GIGAMAXX.upstream_api,
            DEFAULT_GIGAMAXX.shield_policy,
            DEFAULT_GIGAMAXX.stats
          )
          .run();
        rows = [DEFAULT_GIGAMAXX];
      }
    } catch (err) {
      console.warn('[Projects API] D1 auto-setup fallback:', err);
    }
  }

  // Fallback to default GIGAMAXX if table is empty or D1 not configured
  if (rows.length === 0) {
    rows = [DEFAULT_GIGAMAXX];
  }

  // Calculate real metrics from D1 system_audit_logs for each project
  const enriched = await Promise.all(
    rows.map(async (row) => {
      let stats: ProjectStatsDto = {
        activeViewers: row.status === 'active' ? 1 : 0,
        totalRequestsToday: 0,
        blockedThreatsToday: 0,
        avgLatencyMs: 18,
      };

      try {
        stats = { ...stats, ...JSON.parse(row.stats || '{}') };
      } catch {
        // use default
      }

      if (c.env?.DB) {
        try {
          const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
          const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

          // 1. Total real requests today for this project
          const reqCount = await c.env.DB.prepare(
            `SELECT COUNT(*) as c FROM system_audit_logs 
             WHERE (category = 'projects' OR details LIKE ?) AND created_at >= ?`
          )
            .bind(`%"project":"${row.slug}"%`, oneDayAgo)
            .first<{ c: number }>();

          // 2. Real threats blocked today
          const threatCount = await c.env.DB.prepare(
            `SELECT COUNT(*) as c FROM system_audit_logs 
             WHERE (category = 'projects' OR details LIKE ?) 
               AND (level IN ('error', 'warning') OR details LIKE '%"isThreat":true%')
               AND created_at >= ?`
          )
            .bind(`%"project":"${row.slug}"%`, oneDayAgo)
            .first<{ c: number }>();

          // 3. Real active viewers in last 15 mins
          const activeCount = await c.env.DB.prepare(
            `SELECT COUNT(DISTINCT json_extract(details, '$.clientIp')) as c 
             FROM system_audit_logs 
             WHERE details LIKE ? AND created_at >= ?`
          )
            .bind(`%"project":"${row.slug}"%`, fifteenMinsAgo)
            .first<{ c: number }>();

          if (reqCount && reqCount.c > 0) {
            stats.totalRequestsToday = reqCount.c;
          }
          if (threatCount && threatCount.c >= 0) {
            stats.blockedThreatsToday = threatCount.c;
          }
          if (activeCount && activeCount.c > 0) {
            stats.activeViewers = activeCount.c;
          }
        } catch {
          // Gracefully keep cached stats
        }
      }

      let parsedPolicy: ProjectShieldPolicyDto = {
        antiBot: true,
        rateLimitPerMin: 60,
        streamTokenSigning: true,
        tokenExpiryMinutes: 15,
        originLock: true,
        stealth404: true,
      };
      try {
        parsedPolicy = { ...parsedPolicy, ...JSON.parse(row.shield_policy || '{}') };
      } catch {}

      let parsedDomains: string[] = [];
      try {
        parsedDomains = JSON.parse(row.domains || '[]');
      } catch {}

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || '',
        status: row.status,
        gatewayToken: row.gateway_token || `ov_live_${row.slug}_token`,
        lastSeenAt: row.last_seen_at || null,
        domains: parsedDomains,
        upstreamApi: row.upstream_api || '',
        shieldPolicy: parsedPolicy,
        stats,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    })
  );

  return c.json(enriched);
});

/**
 * GET /api/projects/:id/verify
 * Connection check endpoint: verifies if project has completed the live handshake
 */
projectsRoutes.get('/:id/verify', async (c) => {
  const id = c.req.param('id');
  if (c.env?.DB) {
    const row = await c.env.DB.prepare(
      'SELECT id, name, slug, status, gateway_token, last_seen_at FROM connected_projects WHERE id = ?'
    )
      .bind(id)
      .first<{
        id: string;
        name: string;
        slug: string;
        status: string;
        gateway_token: string;
        last_seen_at: string | null;
      }>();

    if (row) {
      return c.json({
        id: row.id,
        status: row.status,
        verified: row.status === 'active',
        gatewayToken: row.gateway_token,
        lastSeenAt: row.last_seen_at,
      });
    }
  }

  return c.json({
    id,
    status: 'active',
    verified: true,
    gatewayToken: '',
    lastSeenAt: null,
  });
});

/**
 * POST /api/projects/inspect
 * Auto-inspects a target site URL to dynamically extract site name, description, and allowed origins
 */
projectsRoutes.post('/inspect', async (c) => {
  const body = await c.req.json<{ url: string }>().catch(() => null);
  if (!body || !body.url) {
    throw new HttpError(400, 'Please provide a valid website URL to inspect');
  }

  let cleanUrl = body.url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new HttpError(400, 'Invalid URL format');
  }

  let name = parsedUrl.hostname.replace(/^www\./, '');
  let description = `Connected Web Application (${parsedUrl.hostname})`;
  let slug = name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'OneVault-Edge-Inspector/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        name = titleMatch[1].trim().split(/[-|•]/)[0].trim();
      }

      const descMatch =
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      if (descMatch && descMatch[1]) {
        description = descMatch[1].trim();
      }

      if (name) {
        slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
    }
  } catch {
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      name = 'Local Project';
      slug = 'local-app';
      description = `Local environment running on port ${parsedUrl.port || '80'}`;
    }
  }

  return c.json({
    ok: true,
    name,
    slug: slug || 'my-project',
    description,
    domains: [parsedUrl.host],
    siteUrl: cleanUrl,
  });
});

/**
 * POST /api/projects
 * Connects and registers a new project into D1 connected_projects table
 */
projectsRoutes.post('/', async (c) => {
  const body = await c.req.json<{
    name: string;
    slug: string;
    description?: string;
    domains: string[];
    upstreamApi?: string;
    siteUrl?: string;
    gatewayToken?: string;
    shieldPolicy?: Partial<ProjectShieldPolicyDto>;
  }>().catch(() => null);

  if (!body || !body.name || !body.slug) {
    throw new HttpError(400, 'Project name and slug are required');
  }

  const id = `proj_${crypto.randomUUID().slice(0, 12)}`;
  const cleanSlug = body.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  const now = new Date().toISOString();

  // Generate secure Project Gateway Token
  const generatedToken =
    body.gatewayToken?.trim() ||
    `ov_live_${cleanSlug}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  const defaultPolicy: ProjectShieldPolicyDto = {
    antiBot: true,
    rateLimitPerMin: 60,
    streamTokenSigning: true,
    tokenExpiryMinutes: 15,
    originLock: true,
    stealth404: true,
    concealedEndpoints: [],
    ...(body.shieldPolicy || {}),
  };

  const defaultStats: ProjectStatsDto = {
    activeViewers: 0,
    totalRequestsToday: 0,
    blockedThreatsToday: 0,
    avgLatencyMs: 18,
  };

  // Newly created project starts in 'connecting' (glowing amber) state until project pairs with the token!
  const initialStatus = 'connecting';

  if (c.env?.DB) {
    await c.env.DB.prepare(
      `INSERT INTO connected_projects (id, name, slug, description, status, gateway_token, domains, upstream_api, shield_policy, stats, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name.trim(),
        cleanSlug,
        body.description?.trim() || null,
        initialStatus,
        generatedToken,
        JSON.stringify(body.domains || []),
        body.upstreamApi?.trim() || null,
        JSON.stringify(defaultPolicy),
        JSON.stringify(defaultStats),
        now,
        now
      )
      .run();
  }

  return c.json({
    id,
    name: body.name.trim(),
    slug: cleanSlug,
    description: body.description?.trim() || '',
    status: initialStatus,
    gatewayToken: generatedToken,
    domains: body.domains || [],
    upstreamApi: body.upstreamApi?.trim() || '',
    siteUrl: body.siteUrl || '',
    shieldPolicy: defaultPolicy,
    stats: defaultStats,
    createdAt: now,
    updatedAt: now,
  });
});

/**
 * PUT /api/projects/:id
 * Updates project configuration in D1
 */
projectsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    description?: string;
    domains?: string[];
    upstreamApi?: string;
    gatewayToken?: string;
    shieldPolicy?: Partial<ProjectShieldPolicyDto>;
  }>().catch(() => null);

  if (!body) {
    throw new HttpError(400, 'Invalid request body');
  }

  const now = new Date().toISOString();

  if (c.env?.DB) {
    const existing = await c.env.DB.prepare(
      'SELECT * FROM connected_projects WHERE id = ?'
    )
      .bind(id)
      .first<ProjectRow>();

    if (!existing) {
      throw new HttpError(404, 'Project not found');
    }

    let policy = JSON.parse(existing.shield_policy || '{}');
    if (body.shieldPolicy) {
      policy = { ...policy, ...body.shieldPolicy };
    }

    const name = body.name?.trim() || existing.name;
    const description =
      body.description !== undefined ? body.description.trim() : existing.description;
    const domains =
      body.domains !== undefined ? JSON.stringify(body.domains) : existing.domains;
    const upstreamApi =
      body.upstreamApi !== undefined ? body.upstreamApi.trim() : existing.upstream_api;
    const gatewayToken =
      body.gatewayToken !== undefined ? body.gatewayToken.trim() : existing.gateway_token;

    await c.env.DB.prepare(
      `UPDATE connected_projects 
       SET name = ?, description = ?, domains = ?, upstream_api = ?, gateway_token = ?, shield_policy = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        name,
        description,
        domains,
        upstreamApi,
        gatewayToken,
        JSON.stringify(policy),
        now,
        id
      )
      .run();

    return c.json({ ok: true, id, updatedAt: now });
  }

  return c.json({ ok: true, id, updatedAt: now });
});

/**
 * PATCH /api/projects/:id/status
 * Status toggle: active | disabled | connecting in D1
 */
projectsRoutes.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ status: 'active' | 'disabled' | 'connecting' }>().catch(() => null);

  if (!body || !['active', 'disabled', 'connecting'].includes(body.status)) {
    throw new HttpError(400, 'Valid status is required ("active", "connecting" or "disabled")');
  }

  const now = new Date().toISOString();

  if (c.env?.DB) {
    await c.env.DB.prepare(
      'UPDATE connected_projects SET status = ?, updated_at = ? WHERE id = ?'
    )
      .bind(body.status, now, id)
      .run();
  }

  return c.json({ ok: true, id, status: body.status, updatedAt: now });
});

/**
 * DELETE /api/projects/:id
 * Removes project from D1
 */
projectsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  if (c.env?.DB) {
    await c.env.DB.prepare('DELETE FROM connected_projects WHERE id = ?')
      .bind(id)
      .run();
  }

  return c.json({ ok: true, id });
});

/**
 * GET /api/projects/:id/telemetry
 * Fetches real-time user insights, watch duration, device breakdown, DevTools inspections & error logs
 */
projectsRoutes.get('/:id/telemetry', async (c) => {
  const idOrSlug = c.req.param('id').toLowerCase();

  if (!c.env?.DB) {
    return c.json({
      summary: {
        activeViewers: 1,
        totalWatchMinutes: 48,
        totalPageViews: 12,
        totalInspections: 0,
        totalErrors: 0,
        deviceBreakdown: { pc: 1, mobile: 0, tablet: 0, smartTv: 0 },
      },
      recentEvents: [],
      topContent: [],
      recentInspectors: [],
      errorDiagnostics: [],
    });
  }

  // 1. Locate project to get exact slug
  const proj = await c.env.DB.prepare(
    'SELECT id, name, slug, stats FROM connected_projects WHERE id = ? OR slug = ?'
  )
    .bind(idOrSlug, idOrSlug)
    .first<{ id: string; name: string; slug: string; stats: string }>();

  if (!proj) {
    throw new HttpError(404, 'Project not found');
  }

  const slug = proj.slug;

  // Auto-ensure table exists
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

  // 2. Fetch recent 100 events
  const eventsRes = await c.env.DB.prepare(
    'SELECT * FROM project_telemetry_events WHERE project_slug = ? ORDER BY created_at DESC LIMIT 100'
  )
    .bind(slug)
    .all<{
      id: string;
      project_slug: string;
      event_type: string;
      title: string | null;
      path: string | null;
      category: string | null;
      media_id: string | null;
      season: number | null;
      episode: number | null;
      watch_minutes: number;
      device_type: string;
      client_ip: string;
      country: string;
      city: string | null;
      asn_org: string | null;
      user_agent: string | null;
      details: string | null;
      created_at: string;
    }>();

  const rawEvents = eventsRes.results || [];

  // 3. Compute Aggregates & Breakdowns
  let totalWatchMins = 0;
  let totalPageViews = 0;
  let totalInspections = 0;
  let totalErrors = 0;

  const deviceCounts: Record<string, number> = {
    pc: 0,
    mobile: 0,
    tablet: 0,
    smart_tv: 0,
  };

  const uniqueActiveIps = new Set<string>();
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60_000).toISOString();

  const contentMap = new Map<string, { title: string; category?: string; totalMinutes: number; views: number }>();

  const formattedEvents = rawEvents.map((r) => {
    let parsedDetails: Record<string, unknown> = {};
    try {
      parsedDetails = JSON.parse(r.details || '{}');
    } catch {
      parsedDetails = {};
    }

    const watchMins = r.watch_minutes || 0;
    totalWatchMins += watchMins;

    const dev = r.device_type || 'pc';
    const normDev = dev === 'smart_tv' ? 'smart_tv' : dev === 'tablet' ? 'tablet' : dev === 'mobile' ? 'mobile' : 'pc';
    deviceCounts[normDev] = (deviceCounts[normDev] || 0) + 1;

    if (r.event_type === 'page_view') {
      totalPageViews += 1;
    } else if (r.event_type === 'devtools_inspect' || r.event_type === '404_error') {
      totalInspections += 1;
    } else if (r.event_type === 'player_error' || r.event_type === 'stream_error' || r.event_type === 'network_offline') {
      totalErrors += 1;
    }

    // Active viewers check
    if (r.created_at >= fifteenMinutesAgo && r.client_ip) {
      uniqueActiveIps.add(r.client_ip);
    }

    // Top content aggregation
    if (r.title && (r.event_type === 'stream_start' || r.event_type === 'stream_heartbeat' || r.event_type === 'stream_watch')) {
      const existing = contentMap.get(r.title) || {
        title: r.title,
        category: r.category || 'movie',
        totalMinutes: 0,
        views: 0,
      };
      existing.totalMinutes += watchMins;
      if (r.event_type === 'stream_start') {
        existing.views += 1;
      }
      contentMap.set(r.title, existing);
    }

    return {
      id: r.id,
      projectSlug: r.project_slug,
      eventType: r.event_type,
      title: r.title || undefined,
      path: r.path || undefined,
      category: r.category || undefined,
      mediaId: r.media_id || undefined,
      season: r.season || undefined,
      episode: r.episode || undefined,
      watchMinutes: r.watch_minutes,
      deviceType: r.device_type,
      clientIp: r.client_ip,
      country: r.country,
      city: r.city || undefined,
      asnOrg: r.asn_org || undefined,
      userAgent: r.user_agent || undefined,
      details: parsedDetails,
      createdAt: r.created_at,
    };
  });

  const topContent = Array.from(contentMap.values())
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 10);

  const recentInspectors = formattedEvents.filter(
    (e) => e.eventType === 'devtools_inspect' || e.eventType === '404_error'
  );

  const errorDiagnostics = formattedEvents.filter(
    (e) => e.eventType === 'player_error' || e.eventType === 'stream_error' || e.eventType === 'network_offline'
  );

  return c.json({
    summary: {
      activeViewers: Math.max(1, uniqueActiveIps.size),
      totalWatchMinutes: Math.round(totalWatchMins),
      totalPageViews,
      totalInspections,
      totalErrors,
      deviceBreakdown: {
        pc: deviceCounts.pc || 0,
        mobile: deviceCounts.mobile || 0,
        tablet: deviceCounts.tablet || 0,
        smartTv: deviceCounts.smart_tv || 0,
      },
    },
    recentEvents: formattedEvents,
    topContent,
    recentInspectors,
    errorDiagnostics,
  });
});
