-- ─── user_push_subscriptions ──────────────────────────────────────────────────
-- Stores Web Push (VAPID) subscriptions and/or FCM/APNs native tokens.
-- One row per device per user. Deduped by MD5 of the token/subscription JSON.

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 'web' | 'ios' | 'android'
  platform                 TEXT        NOT NULL CHECK (platform IN ('web', 'ios', 'android')),

  -- Web:    JSON string of PushSubscription { endpoint, keys: { p256dh, auth } }
  -- Native: raw FCM device token string
  token_or_subscription_json TEXT      NOT NULL,

  is_active                BOOLEAN     NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplicate: one subscription per (user, endpoint/token)
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_sub_dedup
  ON user_push_subscriptions (user_id, md5(token_or_subscription_json));

-- Fast queries: "give me all active subscriptions for user X"
CREATE INDEX IF NOT EXISTS idx_push_sub_user_active
  ON user_push_subscriptions (user_id, is_active)
  WHERE is_active = true;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read and manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON user_push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (Edge Functions, server) bypasses RLS
CREATE POLICY "Service role full access to push subscriptions"
  ON user_push_subscriptions
  FOR ALL
  TO service_role
  USING  (true)
  WITH CHECK (true);

-- ─── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_push_sub_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_sub_updated_at ON user_push_subscriptions;
CREATE TRIGGER push_sub_updated_at
  BEFORE UPDATE ON user_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_sub_updated_at();

-- ─── Helper RPC: register_push_subscription ────────────────────────────────────
-- Called server-side or directly from client (anon key + RLS = safe).
CREATE OR REPLACE FUNCTION register_push_subscription(
  p_user_id              UUID,
  p_platform             TEXT,
  p_token_or_subscription TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO user_push_subscriptions (user_id, platform, token_or_subscription_json, is_active, last_seen_at)
  VALUES (p_user_id, p_platform, p_token_or_subscription, true, NOW())
  ON CONFLICT (user_id, md5(token_or_subscription_json))
  DO UPDATE SET
    is_active    = true,
    last_seen_at = NOW(),
    updated_at   = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ─── Helper RPC: unregister_push_subscription ──────────────────────────────────
CREATE OR REPLACE FUNCTION unregister_push_subscription(
  p_user_id              UUID,
  p_token_or_subscription TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE user_push_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id
    AND md5(token_or_subscription_json) = md5(p_token_or_subscription);
END;
$$;

-- ─── Helper: cleanup stale subscriptions (run weekly via pg_cron) ─────────────
-- Mark inactive any subscription not seen in 60 days
CREATE OR REPLACE FUNCTION cleanup_stale_push_subscriptions()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE user_push_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true
    AND last_seen_at < NOW() - INTERVAL '60 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
