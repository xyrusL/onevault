-- 0003_create_two_factor_tokens.sql
-- Stores 2FA TOTP authenticator tokens in `onevault-storage` D1 database.

CREATE TABLE IF NOT EXISTS two_factor_tokens (
  id          TEXT PRIMARY KEY,
  issuer      TEXT NOT NULL,
  label       TEXT NOT NULL,
  secret      TEXT NOT NULL,
  algorithm   TEXT NOT NULL DEFAULT 'SHA1',
  digits      INTEGER NOT NULL DEFAULT 6,
  period      INTEGER NOT NULL DEFAULT 30,
  otpauth_uri TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_two_factor_tokens_created_at
  ON two_factor_tokens (created_at DESC);
