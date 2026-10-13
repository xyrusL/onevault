-- Migration 0005: Create mail_subdomains table for dedicated email routing subdomains
CREATE TABLE IF NOT EXISTS mail_subdomains (
  id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL,
  root_domain TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  full_domain TEXT NOT NULL UNIQUE,
  dns_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mail_subdomains_zone_id ON mail_subdomains(zone_id);
CREATE INDEX IF NOT EXISTS idx_mail_subdomains_full_domain ON mail_subdomains(full_domain);
