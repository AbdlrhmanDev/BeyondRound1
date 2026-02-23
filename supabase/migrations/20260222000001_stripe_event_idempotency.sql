-- Migration: stripe_event_idempotency
-- Adds a table to track processed Stripe webhook events.
-- Prevents duplicate processing when Stripe retries events (it retries for up to 3 days).
-- Provides replay protection: an attacker resending a captured webhook is a no-op.

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id     TEXT        PRIMARY KEY,
  event_type   TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only service_role can access this table (no client-facing policies needed)
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

-- Index to support the cleanup cron job that purges events older than 7 days
CREATE INDEX IF NOT EXISTS stripe_processed_events_processed_at_idx
  ON public.stripe_processed_events (processed_at);

-- Optional: auto-purge via pg_cron (uncomment if pg_cron extension is enabled)
-- SELECT cron.schedule(
--   'purge-stripe-processed-events',
--   '0 3 * * *',
--   $$
--     DELETE FROM public.stripe_processed_events
--     WHERE processed_at < now() - interval '7 days';
--   $$
-- );
