-- Migration 0011: Create passkeys and passkey_challenges tables for WebAuthn authentication
CREATE TABLE IF NOT EXISTS passkeys (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  name          TEXT NOT NULL,
  public_key    TEXT NOT NULL,
  counter       INTEGER NOT NULL DEFAULT 0,
  device_type   TEXT,
  backed_up     INTEGER NOT NULL DEFAULT 0,
  transports    TEXT,
  aaguid        TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_used_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);

CREATE TABLE IF NOT EXISTS passkey_challenges (
  id          TEXT PRIMARY KEY,
  challenge   TEXT NOT NULL,
  user_id     TEXT,
  type        TEXT NOT NULL, -- 'registration' | 'authentication'
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires ON passkey_challenges(expires_at);
