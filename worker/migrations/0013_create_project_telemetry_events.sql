-- 0013_create_project_telemetry_events.sql
-- Real-time analytics, user watch duration, device breakdown, DevTools inspections & error telemetry

CREATE TABLE IF NOT EXISTS project_telemetry_events (
  id                  TEXT PRIMARY KEY,
  project_slug        TEXT NOT NULL,
  event_type          TEXT NOT NULL, -- 'page_view' | 'stream_start' | 'stream_heartbeat' | 'stream_watch' | 'devtools_inspect' | '404_error' | 'player_error' | 'network_offline'
  title               TEXT,          -- Media title or Page title
  path                TEXT,          -- URL route or probed path
  category            TEXT,          -- 'movie' | 'tv' | 'anime' | 'navigation' | 'security' | 'system'
  media_id            TEXT,
  season              INTEGER,
  episode             INTEGER,
  watch_minutes       REAL DEFAULT 0,
  device_type         TEXT NOT NULL DEFAULT 'pc', -- 'pc' | 'mobile' | 'tablet' | 'smart_tv' | 'console' | 'unknown'
  client_ip           TEXT NOT NULL DEFAULT '127.0.0.1',
  country             TEXT NOT NULL DEFAULT 'Global',
  city                TEXT,
  asn_org             TEXT,
  user_agent          TEXT,
  details             TEXT DEFAULT '{}', -- JSON metadata (DevTools trigger, error stack, screen res, etc.)
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_proj_telemetry_slug_created
  ON project_telemetry_events (project_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proj_telemetry_event_type
  ON project_telemetry_events (event_type);

CREATE INDEX IF NOT EXISTS idx_proj_telemetry_device_type
  ON project_telemetry_events (device_type);
