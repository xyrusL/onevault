-- Migration 0006: Create admin_users table for credential authentication in D1
CREATE TABLE IF NOT EXISTS admin_users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Temporary admin account (admin@admin.com / admin)
-- Stored with SHA-256 hash of 'admin'
INSERT OR IGNORE INTO admin_users (id, email, password_hash, role)
VALUES (
  'usr_admin_default',
  'admin@admin.com',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'admin'
);
