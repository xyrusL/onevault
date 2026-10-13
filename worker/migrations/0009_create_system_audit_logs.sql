-- 0009_create_system_audit_logs.sql
-- Stores system events, security alerts, warnings, and non-fatal errors with timestamps

CREATE TABLE IF NOT EXISTS system_audit_logs (
  id          TEXT PRIMARY KEY,
  level       TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warning' | 'error'
  category    TEXT NOT NULL DEFAULT 'system', -- 'mail' | 'two_factor' | 'notes' | 'auth' | 'system'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  details     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at
  ON system_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_audit_logs_level
  ON system_audit_logs (level, created_at DESC);
