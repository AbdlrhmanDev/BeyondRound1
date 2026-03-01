-- =============================================================================
-- Security Hardening Migration
-- Resolves all Supabase security linter ERRORs and WARN search_path issues:
--
-- ERRORS fixed:
--   1. user_roles       - RLS enabled, policies exist but RLS was toggled off
--   2. user_settings    - same as above
--   3. bot_suggestions  - RLS disabled in public schema
--   4. products         - RLS disabled in public schema
--   5. processed_webhook_events - RLS disabled in public schema
--   6. feedback_analytics view  - SECURITY DEFINER → SECURITY INVOKER
--   7. event_capacity view      - SECURITY DEFINER → SECURITY INVOKER
--
-- WARNINGS fixed (function search_path mutable):
--   sync_verification_to_profile, update_push_sub_updated_at,
--   register_push_subscription, unregister_push_subscription,
--   handle_new_user, is_group_conversation_member, is_admin,
--   update_polls_updated_at, list_available_events,
--   cleanup_stale_push_subscriptions, create_booking,
--   confirm_booking_if_verified, run_thursday_matching,
--   mark_booking_paid, upsert_subscription, send_drip_emails
--
-- NOT fixed here (require dashboard/manual action):
--   - auth_leaked_password_protection  (Auth dashboard setting)
--   - extension_in_public (http)       (requires extension reinstall)
--   - rls_policy_always_true warnings  (intentional for public submit forms)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Enable RLS on tables that are missing it
-- ─────────────────────────────────────────────────────────────────────────────

-- user_roles: migration enabled it but it was toggled off manually
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- user_settings: same situation
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- processed_webhook_events: idempotency table, service_role only
-- No user-facing policies needed; service_role bypasses RLS by default.
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- bot_suggestions: AI-generated suggestions, system writes / users read
ALTER TABLE public.bot_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to bot_suggestions" ON public.bot_suggestions;
CREATE POLICY "Service role full access to bot_suggestions"
  ON public.bot_suggestions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view bot suggestions" ON public.bot_suggestions;
CREATE POLICY "Authenticated users can view bot suggestions"
  ON public.bot_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- products: Stripe product / pricing records, publicly readable
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role manages products" ON public.products;
CREATE POLICY "Service role manages products"
  ON public.products FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Fix SECURITY DEFINER views → SECURITY INVOKER
-- This ensures views respect the calling user's RLS policies rather than
-- running with the view owner's (postgres/supabase_admin) permissions.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER VIEW IF EXISTS public.feedback_analytics SET (security_invoker = on);
ALTER VIEW IF EXISTS public.event_capacity     SET (security_invoker = on);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Fix mutable search_path — functions with known source
-- Recreate each function adding SET search_path = public so that
-- objects are resolved against the public schema only, preventing
-- search_path hijacking attacks.
-- ─────────────────────────────────────────────────────────────────────────────

-- sync_verification_to_profile
CREATE OR REPLACE FUNCTION public.sync_verification_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = NEW.status
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- update_push_sub_updated_at
CREATE OR REPLACE FUNCTION public.update_push_sub_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- register_push_subscription
CREATE OR REPLACE FUNCTION public.register_push_subscription(
  p_user_id               UUID,
  p_platform              TEXT,
  p_token_or_subscription TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.user_push_subscriptions
    (user_id, platform, token_or_subscription_json, is_active, last_seen_at)
  VALUES
    (p_user_id, p_platform, p_token_or_subscription, true, NOW())
  ON CONFLICT (user_id, md5(token_or_subscription_json))
  DO UPDATE SET
    is_active    = true,
    last_seen_at = NOW(),
    updated_at   = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- unregister_push_subscription
CREATE OR REPLACE FUNCTION public.unregister_push_subscription(
  p_user_id               UUID,
  p_token_or_subscription TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_push_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id
    AND md5(token_or_subscription_json) = md5(p_token_or_subscription);
END;
$$;

-- handle_new_user (already had search_path set; re-apply to ensure live DB matches)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- is_group_conversation_member: use ALTER FUNCTION to avoid re-specifying the body
-- (the underlying table name may differ from what's in the migration source)
ALTER FUNCTION public.is_group_conversation_member(uuid, uuid) SET search_path = public;

-- update_polls_updated_at
CREATE OR REPLACE FUNCTION public.update_polls_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- cleanup_stale_push_subscriptions
CREATE OR REPLACE FUNCTION public.cleanup_stale_push_subscriptions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.user_push_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true
    AND last_seen_at < NOW() - INTERVAL '60 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- upsert_subscription
CREATE OR REPLACE FUNCTION public.upsert_subscription(
  p_user_id                     UUID,
  p_stripe_customer_id          TEXT,
  p_stripe_subscription_id      TEXT       DEFAULT NULL,
  p_stripe_subscription_item_id TEXT       DEFAULT NULL,
  p_stripe_price_id             TEXT       DEFAULT NULL,
  p_status                      TEXT       DEFAULT 'inactive',
  p_plan_name                   TEXT       DEFAULT NULL,
  p_interval                    TEXT       DEFAULT NULL,
  p_current_period_start        TIMESTAMPTZ DEFAULT NULL,
  p_current_period_end          TIMESTAMPTZ DEFAULT NULL,
  p_cancel_at_period_end        BOOLEAN    DEFAULT false,
  p_canceled_at                 TIMESTAMPTZ DEFAULT NULL,
  p_trial_end                   TIMESTAMPTZ DEFAULT NULL,
  p_payment_failed_at           TIMESTAMPTZ DEFAULT NULL,
  p_next_payment_attempt        TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    stripe_customer_id            = EXCLUDED.stripe_customer_id,
    stripe_subscription_id        = COALESCE(EXCLUDED.stripe_subscription_id,       subscriptions.stripe_subscription_id),
    stripe_subscription_item_id   = COALESCE(EXCLUDED.stripe_subscription_item_id,  subscriptions.stripe_subscription_item_id),
    stripe_price_id               = COALESCE(EXCLUDED.stripe_price_id,              subscriptions.stripe_price_id),
    status                        = EXCLUDED.status,
    plan_name                     = COALESCE(EXCLUDED.plan_name,                    subscriptions.plan_name),
    interval                      = COALESCE(EXCLUDED.interval,                     subscriptions.interval),
    current_period_start          = COALESCE(EXCLUDED.current_period_start,         subscriptions.current_period_start),
    current_period_end            = COALESCE(EXCLUDED.current_period_end,           subscriptions.current_period_end),
    cancel_at_period_end          = EXCLUDED.cancel_at_period_end,
    canceled_at                   = EXCLUDED.canceled_at,
    trial_end                     = COALESCE(EXCLUDED.trial_end,                    subscriptions.trial_end),
    payment_failed_at             = EXCLUDED.payment_failed_at,
    next_payment_attempt          = EXCLUDED.next_payment_attempt,
    updated_at                    = now();
END;
$$;

-- send_drip_emails
CREATE OR REPLACE FUNCTION public.send_drip_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_status  integer;
  response_content text;
  supabase_url     text;
  service_role_key text;
  function_url     text;
BEGIN
  supabase_url     := current_setting('app.settings.supabase_url',     true);
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
      http_header('Content-Type',  'application/json'),
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


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Fix mutable search_path — functions without local source
-- These functions were created directly in the Supabase console.
-- We use ALTER FUNCTION with dynamically resolved parameter signatures
-- so we don't need to re-specify the function body.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  rec      RECORD;
  fn_names TEXT[] := ARRAY[
    'is_admin',
    'list_available_events',
    'create_booking',
    'confirm_booking_if_verified',
    'run_thursday_matching',
    'mark_booking_paid'
  ];
  fn_name  TEXT;
BEGIN
  FOREACH fn_name IN ARRAY fn_names LOOP
    FOR rec IN
      SELECT pg_get_function_arguments(p.oid) AS args
      FROM   pg_proc p
      JOIN   pg_namespace n ON n.oid = p.pronamespace
      WHERE  n.nspname = 'public'
        AND  p.proname = fn_name
    LOOP
      EXECUTE format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public',
        fn_name, rec.args
      );
    END LOOP;
  END LOOP;
END $$;
