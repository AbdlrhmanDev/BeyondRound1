-- ─────────────────────────────────────────────────────────────────────────────
-- Billing improvements migration
-- Adds missing columns + tighter RLS (service_role INSERT/UPDATE/DELETE)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── subscriptions: add missing columns ───────────────────────────────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_item_id TEXT,   -- needed for plan-switch (items API)
  ADD COLUMN IF NOT EXISTS trial_end                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_attempt      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interval                  TEXT;      -- month | year (denormalised for UI)

-- ── invoices: add missing columns ────────────────────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS attempt_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt   TIMESTAMPTZ;

-- ── RLS: service_role must be able to INSERT/UPDATE/DELETE ────────────────────
-- Webhooks run as service_role, which bypasses RLS by default in Supabase
-- (service_role ignores RLS unless you explicitly set row_security = on for it).
-- These policies are belt-and-suspenders for environments that enable service_role RLS.

-- subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Service role full access to subscriptions'
  ) THEN
    CREATE POLICY "Service role full access to subscriptions"
      ON public.subscriptions FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoices' AND policyname = 'Service role full access to invoices'
  ) THEN
    CREATE POLICY "Service role full access to invoices"
      ON public.invoices FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- payment_methods
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_methods' AND policyname = 'Service role full access to payment_methods'
  ) THEN
    CREATE POLICY "Service role full access to payment_methods"
      ON public.payment_methods FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── Helper: upsert_subscription ──────────────────────────────────────────────
-- Called by Edge Functions to ensure exactly ONE subscription row per user.
-- Uses ON CONFLICT on user_id.
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_user_id                    UUID,
  p_stripe_customer_id         TEXT,
  p_stripe_subscription_id     TEXT DEFAULT NULL,
  p_stripe_subscription_item_id TEXT DEFAULT NULL,
  p_stripe_price_id            TEXT DEFAULT NULL,
  p_status                     TEXT DEFAULT 'inactive',
  p_plan_name                  TEXT DEFAULT NULL,
  p_interval                   TEXT DEFAULT NULL,
  p_current_period_start       TIMESTAMPTZ DEFAULT NULL,
  p_current_period_end         TIMESTAMPTZ DEFAULT NULL,
  p_cancel_at_period_end       BOOLEAN DEFAULT false,
  p_canceled_at                TIMESTAMPTZ DEFAULT NULL,
  p_trial_end                  TIMESTAMPTZ DEFAULT NULL,
  p_payment_failed_at          TIMESTAMPTZ DEFAULT NULL,
  p_next_payment_attempt       TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id, stripe_customer_id, stripe_subscription_id,
    stripe_subscription_item_id, stripe_price_id, status, plan_name, interval,
    current_period_start, current_period_end, cancel_at_period_end,
    canceled_at, trial_end, payment_failed_at, next_payment_attempt,
    created_at, updated_at
  )
  VALUES (
    p_user_id, p_stripe_customer_id, p_stripe_subscription_id,
    p_stripe_subscription_item_id, p_stripe_price_id, p_status, p_plan_name, p_interval,
    p_current_period_start, p_current_period_end, p_cancel_at_period_end,
    p_canceled_at, p_trial_end, p_payment_failed_at, p_next_payment_attempt,
    now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id           = EXCLUDED.stripe_customer_id,
    stripe_subscription_id       = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
    stripe_subscription_item_id  = COALESCE(EXCLUDED.stripe_subscription_item_id, subscriptions.stripe_subscription_item_id),
    stripe_price_id              = COALESCE(EXCLUDED.stripe_price_id, subscriptions.stripe_price_id),
    status                       = EXCLUDED.status,
    plan_name                    = COALESCE(EXCLUDED.plan_name, subscriptions.plan_name),
    interval                     = COALESCE(EXCLUDED.interval, subscriptions.interval),
    current_period_start         = COALESCE(EXCLUDED.current_period_start, subscriptions.current_period_start),
    current_period_end           = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
    cancel_at_period_end         = EXCLUDED.cancel_at_period_end,
    canceled_at                  = EXCLUDED.canceled_at,
    trial_end                    = COALESCE(EXCLUDED.trial_end, subscriptions.trial_end),
    payment_failed_at            = EXCLUDED.payment_failed_at,
    next_payment_attempt         = EXCLUDED.next_payment_attempt,
    updated_at                   = now();
END;
$$;
