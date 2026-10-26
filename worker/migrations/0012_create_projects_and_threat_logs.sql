-- 0012_create_projects_and_threat_logs.sql
-- Registers multi-tenant projects and tracks project-level threat intelligence & activity

CREATE TABLE IF NOT EXISTS connected_projects (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'active', -- 'active' | 'connecting' | 'disabled' | 'maintenance'
  gateway_token       TEXT NOT NULL DEFAULT '',
  domains             TEXT NOT NULL DEFAULT '[]', -- JSON array of allowed origins
  upstream_api        TEXT,
  shield_policy       TEXT NOT NULL DEFAULT '{}', -- JSON config of shield settings
  stats               TEXT NOT NULL DEFAULT '{}', -- JSON stats cache
  last_seen_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_connected_projects_slug
  ON connected_projects (slug);

-- Seed GIGAMAXX as flagship connected streaming project
INSERT OR IGNORE INTO connected_projects (id, name, slug, description, status, gateway_token, domains, upstream_api, shield_policy, stats)
VALUES (
  'proj_gigamaxx_4k',
  'GIGAMAXX 4K',
  'gigamaxx',
  'High-speed 4K streaming web platform — movies, series & anime with zero public API leaks.',
  'active',
  'ov_live_gigamaxx_4k_98f2a1b7e4',
  '["gigamaxx.com","localhost:5173","localhost:4173"]',
  'https://api.framextv.cc',
  '{"antiBot":true,"rateLimitPerMin":60,"streamTokenSigning":true,"tokenExpiryMinutes":15,"originLock":true,"stealth404":true}',
  '{"activeViewers":1,"totalRequestsToday":0,"blockedThreatsToday":0,"avgLatencyMs":18}'
);
