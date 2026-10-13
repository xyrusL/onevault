-- Mail addresses created from the portal.
-- routing_rule_id / zone_id let us delete the Cloudflare Email Routing rule later.
CREATE TABLE IF NOT EXISTS mail_accounts (
  id               TEXT PRIMARY KEY,
  local_part       TEXT NOT NULL,
  domain           TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  zone_id          TEXT NOT NULL,
  routing_rule_id  TEXT,
  forward_to       TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_mail_accounts_created_at
  ON mail_accounts (created_at DESC);
