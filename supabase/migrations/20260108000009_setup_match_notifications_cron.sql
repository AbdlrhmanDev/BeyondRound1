-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Grant usage on schema cron to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Set project configuration
-- Project URL: https://peqluzhrhgnwjhvxxtzs.supabase.co
ALTER DATABASE postgres SET app.settings.supabase_ur

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.send_match_notifications()
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
  -- Get Supabase URL and service role key from database settings
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Build function URL
  IF supabase_url IS NULL OR supabase_url = '' THEN
    RAISE EXCEPTION 'Supabase URL not configured';
  END IF;
  
  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE EXCEPTION 'Service role key not configured';
  END IF;
  
  function_url := supabase_url || '/functions/v1/send-match-notifications';
  
  -- Call the Supabase Edge Function via HTTP
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

  -- Log the result
  RAISE NOTICE 'Notification function called. Status: %, Response: %', response_status, response_content;
  
  -- Raise error if request failed
  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to call Edge Function. Status: %, Response: %', response_status, response_content;
  END IF;
END;
$$;

-- Remove existing schedule if it exists
SELECT cron.unschedule('send-match-notifications-thursday-4pm') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm'
);

-- Schedule the cron job to run every Thursday at 4:00 PM (UTC)
-- Cron format: minute hour day month weekday
-- 0 16 * * 4 means: at 16:00 (4 PM UTC) on every Thursday (4 = Thursday)
SELECT cron.schedule(
  'send-match-notifications-thursday-4pm',
  '0 16 * * 4', -- Every Thursday at 4:00 PM UTC
  $$SELECT public.send_match_notifications();$$
);

-- Verify the schedule was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-match-notifications-thursday-4pm') THEN
    RAISE NOTICE 'Cron job scheduled successfully: send-match-notifications-thursday-4pm';
  ELSE
    RAISE WARNING 'Failed to create cron job';
  END IF;
END $$;
