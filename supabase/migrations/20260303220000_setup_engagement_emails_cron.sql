-- Setup daily pg_cron job for Phase 3 engagement emails (E1/E2/E3)
-- Runs at 8 AM UTC daily, calling the send-engagement-emails edge function

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

GRANT USAGE ON SCHEMA cron TO postgres;

-- ─── PL/pgSQL function that calls the edge function ───────────────────────────

CREATE OR REPLACE FUNCTION public.send_engagement_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_status integer;
  response_content text;
  supabase_url text;
  service_role_key text;
  function_url text;
BEGIN
  SELECT value INTO supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_config WHERE key = 'service_role_key';

  IF supabase_url IS NULL OR supabase_url = '' THEN
    RAISE EXCEPTION 'Supabase URL not configured in app_config table';
  END IF;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE EXCEPTION 'Service role key not configured in app_config table';
  END IF;

  function_url := supabase_url || '/functions/v1/send-engagement-emails';

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

  RAISE NOTICE '✅ Engagement emails function called. Status: %, Response: %', response_status, response_content;

  IF response_status != 200 THEN
    RAISE EXCEPTION '❌ Failed to call send-engagement-emails. Status: %, Response: %', response_status, response_content;
  END IF;
END;
$$;

-- ─── Remove old schedule if it exists ────────────────────────────────────────

DO $$
BEGIN
  PERFORM cron.unschedule('send-engagement-emails-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ─── Schedule: 8 AM UTC daily ────────────────────────────────────────────────

SELECT cron.schedule(
  'send-engagement-emails-daily',
  '0 8 * * *',
  $$SELECT public.send_engagement_emails();$$
);

-- ─── Verify schedule was created ─────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-engagement-emails-daily') THEN
    RAISE NOTICE '✅ Cron job scheduled: send-engagement-emails-daily';
    RAISE NOTICE '📅 Schedule: Every day at 8:00 AM UTC';
  ELSE
    RAISE WARNING '❌ Failed to create cron job';
  END IF;
END $$;
