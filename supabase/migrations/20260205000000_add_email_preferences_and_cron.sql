-- Add email_preferences JSONB column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "booking_confirmations": true,
  "match_notifications": true,
  "reminders": true
}'::jsonb;

-- Add is_bot column to group_messages table
ALTER TABLE group_messages
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;

-- Create index for bot messages
CREATE INDEX IF NOT EXISTS idx_group_messages_is_bot ON group_messages(is_bot) WHERE is_bot = true;

-- Comment on the columns
COMMENT ON COLUMN profiles.email_preferences IS 'User email notification preferences: booking_confirmations, match_notifications, reminders';
COMMENT ON COLUMN group_messages.is_bot IS 'Whether this message was sent by the RoundsBot assistant';

-- Enable pg_cron extension if not already enabled
-- Note: This requires superuser access and may already be enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule Friday reminder at 9 AM UTC every Friday
-- Note: This requires pg_cron to be enabled and properly configured
-- The actual cron job needs to be created via Supabase dashboard or SQL with proper permissions
--
-- Example (run in SQL editor with proper permissions):
-- SELECT cron.schedule(
--   'friday-meetup-reminder',
--   '0 9 * * 5',  -- Every Friday at 9 AM UTC
--   $$
--   SELECT net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-friday-reminder',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
--     body := '{}'::jsonb
--   )
--   $$
-- );
