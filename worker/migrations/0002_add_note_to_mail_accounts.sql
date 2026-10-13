-- 0002_add_note_to_mail_accounts.sql
-- Adds optional note column to mail_accounts in `onevault-storage`.

ALTER TABLE mail_accounts ADD COLUMN note TEXT;
