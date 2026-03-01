-- Add unsubscribe tracking to waitlist
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast filtering in drip function (WHERE unsubscribed_at IS NULL)
CREATE INDEX IF NOT EXISTS waitlist_unsubscribed_idx
  ON public.waitlist (unsubscribed_at)
  WHERE unsubscribed_at IS NULL;

-- Allow service_role to update the unsubscribe column
GRANT UPDATE (unsubscribed_at) ON public.waitlist TO service_role;
