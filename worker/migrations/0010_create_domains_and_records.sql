-- Migration 0010: Create custom_domains and domain_dns_records tables
CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY,
  zone_id TEXT,
  name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',
  name_servers TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS domain_dns_records (
  id TEXT PRIMARY KEY,
  domain_name TEXT NOT NULL,
  zone_id TEXT,
  subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  ttl INTEGER DEFAULT 1,
  proxied INTEGER DEFAULT 1,
  comment TEXT,
  cf_record_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domain_dns_records_domain_name ON domain_dns_records(domain_name);
CREATE INDEX IF NOT EXISTS idx_domain_dns_records_name ON domain_dns_records(name);
CREATE INDEX IF NOT EXISTS idx_custom_domains_name ON custom_domains(name);
