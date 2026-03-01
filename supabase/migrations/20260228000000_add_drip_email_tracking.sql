-- Add drip campaign tracking columns to waitlist table
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS last_drip_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS drip_count INT NOT NULL DEFAULT 0;

-- Index for efficient querying of members due for their next drip
CREATE INDEX IF NOT EXISTS waitlist_drip_tracking_idx
  ON public.waitlist (created_at, last_drip_sent_at);

-- Grant UPDATE on waitlist to service_role (needed by Edge Function)
GRANT UPDATE ON public.waitlist TO service_role;

-- Create a function to invoke the send-drip-emails Edge Function via HTTP
CREATE OR REPLACE FUNCTION public.send_drip_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status integer;
  response_content text;
  supabase_url text;
  service_role_key text;
  function_url text;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  IF supabase_url IS NULL OR supabase_url = '' THEN
    RAISE EXCEPTION 'Supabase URL not configured';
  END IF;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE EXCEPTION 'Service role key not configured';
  END IF;

  function_url := supabase_url || '/functions/v1/send-drip-emails';

  SELECT status, content INTO response_status, response_content
  FROM http((
    'POST',
    function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_role_key)
    ],
    'application/json',
    '{}'
  )::http_request);

  RAISE NOTICE 'Drip email function called. Status: %, Response: %', response_status, response_content;

  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to call send-drip-emails. Status: %, Response: %', response_status, response_content;
  END IF;
END;
$$;

-- Remove existing schedule if it exists
SELECT cron.unschedule('send-drip-emails-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-drip-emails-daily'
);

-- Schedule daily at 8 AM UTC — the Edge Function handles the launch-date cutoff
SELECT cron.schedule(
  'send-drip-emails-daily',
  '0 8 * * *',
  $$SELECT public.send_drip_emails();$$
);

-- Verify
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-drip-emails-daily') THEN
    RAISE NOTICE 'Cron job scheduled successfully: send-drip-emails-daily';
  ELSE
    RAISE WARNING 'Failed to create cron job: send-drip-emails-daily';
  END IF;
END $$;
