-- 0014_add_session_id_to_telemetry.sql
-- Adds session_id column for accurate unique viewer tracking across NAT/shared Wi-Fi

ALTER TABLE project_telemetry_events ADD COLUMN session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_proj_telemetry_session ON project_telemetry_events (session_id);
