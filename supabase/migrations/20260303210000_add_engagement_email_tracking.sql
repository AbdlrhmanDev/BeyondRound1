-- Add engagement email tracking columns for Phase 3 post-verification emails
-- E1 tracked on profiles (verification approved), E2+E3 tracked on group_members

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verified_welcome_sent_at TIMESTAMPTZ;

ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS match_welcome_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;

-- Backfill existing group_members to avoid spamming historical members on deploy
UPDATE group_members
SET
  match_welcome_sent_at = now(),
  followup_sent_at = now()
WHERE match_welcome_sent_at IS NULL;
