-- 0004_create_mail_messages.sql
-- Stores incoming emails in `onevault-storage` D1 when a mailbox has Forward To = None.

CREATE TABLE IF NOT EXISTS mail_messages (
  id              TEXT PRIMARY KEY,
  mail_account_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sender          TEXT NOT NULL,
  sender_name     TEXT NOT NULL,
  subject         TEXT NOT NULL,
  snippet         TEXT NOT NULL,
  text_body       TEXT,
  html_body       TEXT,
  raw_mime        TEXT NOT NULL,
  is_read         INTEGER NOT NULL DEFAULT 0,
  received_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (mail_account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mail_messages_account_received
  ON mail_messages (mail_account_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_mail_messages_recipient
  ON mail_messages (recipient_email, received_at DESC);
