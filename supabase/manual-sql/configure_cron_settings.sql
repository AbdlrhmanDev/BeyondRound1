-- =============================================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Rewrites send_drip_emails() to use pg_net (always available in Supabase)
-- instead of the http extension + current_setting() which requires superuser.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.send_drip_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url     text := 'https://peqluzhrhgnwjhvxxtzs.supabase.co';
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc';
  request_id       bigint;
BEGIN
  SELECT net.http_post(
    url     := supabase_url || '/functions/v1/send-drip-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body    := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'send-drip-emails invoked — pg_net request_id: %', request_id;
END;
$$;

-- Verify the cron job still exists
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'send-drip-emails-daily';
