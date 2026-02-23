-- ============================================================
-- Admin: Group Member Management
-- Adds: verification workflow, membership lifecycle,
--        score denormalisation, concurrency-safe RPCs
-- ============================================================

-- 1. Extend match_groups
ALTER TABLE public.match_groups
  ADD COLUMN IF NOT EXISTS member_count  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score         NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS score_count   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_members   INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_members   INT NOT NULL DEFAULT 3;

-- Allow 'locked' status
ALTER TABLE public.match_groups
  DROP CONSTRAINT IF EXISTS match_groups_status_check;
ALTER TABLE public.match_groups
  ADD CONSTRAINT match_groups_status_check
  CHECK (status IN ('active','pending','disbanded','locked'));

-- 2. Verification status enum
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM
    ('pending','verified','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Group member verifications table
CREATE TABLE IF NOT EXISTS public.group_member_verifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID        NOT NULL REFERENCES public.match_groups(id)  ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id)            ON DELETE CASCADE,
  initiated_by    UUID        NOT NULL REFERENCES auth.users(id),
  status          public.verification_status NOT NULL DEFAULT 'pending',
  decision_by     UUID        REFERENCES auth.users(id),
  decision_at     TIMESTAMPTZ,
  decision_reason TEXT,
  token           TEXT        UNIQUE DEFAULT gen_random_uuid()::TEXT,
  expires_at      TIMESTAMPTZ DEFAULT (now() + INTERVAL '72 hours'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gmv_group  ON public.group_member_verifications(group_id);
CREATE INDEX IF NOT EXISTS idx_gmv_user   ON public.group_member_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_gmv_status ON public.group_member_verifications(status);

-- RLS
ALTER TABLE public.group_member_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage verifications"
  ON public.group_member_verifications
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Membership status enum + extend group_members
DO $$ BEGIN
  CREATE TYPE public.membership_status AS ENUM ('pending','active','removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS status         public.membership_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS added_by       UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS removed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removal_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_gm_status ON public.group_members(status);

-- Backfill existing rows (all pre-existing memberships are active)
UPDATE public.group_members SET status = 'active' WHERE status IS NULL;

-- 5. Backfill member_count on match_groups from existing active memberships
UPDATE public.match_groups mg
SET member_count = (
  SELECT COUNT(*)
  FROM public.group_members gm
  WHERE gm.group_id = mg.id
    AND gm.status = 'active'
);

-- 6. Score recalculation trigger
CREATE OR REPLACE FUNCTION public.recalculate_group_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_gid UUID;
  v_avg NUMERIC(4,2);
  v_cnt INT;
BEGIN
  v_gid := COALESCE(NEW.group_id, OLD.group_id);

  SELECT ROUND(AVG(meeting_rating)::NUMERIC, 2), COUNT(*)
  INTO v_avg, v_cnt
  FROM public.group_evaluations
  WHERE group_id = v_gid
    AND meeting_rating IS NOT NULL;

  UPDATE public.match_groups
  SET score       = v_avg,
      score_count = v_cnt,
      updated_at  = now()
  WHERE id = v_gid;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_score_recalc ON public.group_evaluations;
CREATE TRIGGER trg_group_score_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.group_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_group_score();

-- Backfill scores from existing evaluations
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT group_id FROM public.group_evaluations LOOP
    UPDATE public.match_groups
    SET score = (
          SELECT ROUND(AVG(meeting_rating)::NUMERIC, 2)
          FROM public.group_evaluations
          WHERE group_id = r.group_id AND meeting_rating IS NOT NULL
        ),
        score_count = (
          SELECT COUNT(*)
          FROM public.group_evaluations
          WHERE group_id = r.group_id AND meeting_rating IS NOT NULL
        )
    WHERE id = r.group_id;
  END LOOP;
END $$;

-- 7. RPC: admin_add_group_member (concurrency-safe via FOR UPDATE)
CREATE OR REPLACE FUNCTION public.admin_add_group_member(
  p_group_id  UUID,
  p_user_id   UUID,
  p_reason    TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_admin_id  UUID := auth.uid();
  v_group     RECORD;
  v_slots     INT;
  v_member_id UUID;
  v_verif_id  UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  -- Lock row to prevent concurrent over-fill
  SELECT id, status, member_count, max_members
  INTO v_group
  FROM public.match_groups
  WHERE id = p_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','group_not_found');
  END IF;

  IF v_group.status IN ('locked','disbanded') THEN
    RETURN jsonb_build_object('error','group_at_capacity');
  END IF;

  -- Count active + pending slots
  SELECT COUNT(*) INTO v_slots
  FROM public.group_members
  WHERE group_id = p_group_id
    AND status IN ('active','pending');

  IF v_slots >= v_group.max_members THEN
    RETURN jsonb_build_object('error','group_at_capacity');
  END IF;

  -- Duplicate check
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id  = p_user_id
      AND status IN ('active','pending')
  ) THEN
    RETURN jsonb_build_object('error','already_member');
  END IF;

  -- Insert pending membership
  INSERT INTO public.group_members(group_id, user_id, status, added_by)
  VALUES (p_group_id, p_user_id, 'pending', v_admin_id)
  RETURNING id INTO v_member_id;

  -- Insert verification record
  INSERT INTO public.group_member_verifications(group_id, user_id, initiated_by)
  VALUES (p_group_id, p_user_id, v_admin_id)
  RETURNING id INTO v_verif_id;

  -- Audit log
  INSERT INTO public.admin_audit_logs(admin_id, action, target_user_id, metadata)
  VALUES (
    v_admin_id,
    'admin_add_member_pending',
    p_user_id,
    jsonb_build_object('group_id', p_group_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'membership_id',   v_member_id,
    'verification_id', v_verif_id,
    'status',          'pending'
  );
END;
$$;

-- 8. RPC: admin_verify_group_member
CREATE OR REPLACE FUNCTION public.admin_verify_group_member(
  p_group_id  UUID,
  p_user_id   UUID,
  p_decision  TEXT,       -- 'verified' | 'rejected'
  p_reason    TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_verif    RECORD;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  IF p_decision NOT IN ('verified','rejected') THEN
    RETURN jsonb_build_object('error','invalid_decision');
  END IF;

  SELECT * INTO v_verif
  FROM public.group_member_verifications
  WHERE group_id = p_group_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','verification_not_found');
  END IF;

  IF v_verif.status NOT IN ('pending','expired') THEN
    RETURN jsonb_build_object('error','already_decided');
  END IF;

  IF v_verif.initiated_by = v_admin_id THEN
    RETURN jsonb_build_object('error','self_verify_forbidden');
  END IF;

  -- Record decision
  UPDATE public.group_member_verifications SET
    status          = p_decision::public.verification_status,
    decision_by     = v_admin_id,
    decision_at     = now(),
    decision_reason = p_reason,
    updated_at      = now()
  WHERE id = v_verif.id;

  IF p_decision = 'verified' THEN
    UPDATE public.group_members SET status = 'active'
    WHERE group_id = p_group_id AND user_id = p_user_id;

    UPDATE public.match_groups
    SET member_count = member_count + 1,
        updated_at   = now()
    WHERE id = p_group_id;
  ELSE
    UPDATE public.group_members SET status = 'removed'
    WHERE group_id = p_group_id AND user_id = p_user_id;
  END IF;

  INSERT INTO public.admin_audit_logs(admin_id, action, target_user_id, metadata)
  VALUES (
    v_admin_id,
    CASE p_decision WHEN 'verified' THEN 'admin_verify_member' ELSE 'admin_reject_member' END,
    p_user_id,
    jsonb_build_object('group_id', p_group_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'status',          p_decision,
    'membership_status', CASE p_decision WHEN 'verified' THEN 'active' ELSE 'removed' END
  );
END;
$$;

-- 9. RPC: admin_resend_verification
CREATE OR REPLACE FUNCTION public.admin_resend_verification(
  p_group_id UUID,
  p_user_id  UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_admin_id  UUID := auth.uid();
  v_new_token TEXT := gen_random_uuid()::TEXT;
  v_expires   TIMESTAMPTZ := now() + INTERVAL '72 hours';
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('error','forbidden');
  END IF;

  UPDATE public.group_member_verifications SET
    status     = 'pending',
    token      = v_new_token,
    expires_at = v_expires,
    updated_at = now()
  WHERE group_id = p_group_id
    AND user_id  = p_user_id
    AND status NOT IN ('verified','rejected');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','not_resendable');
  END IF;

  INSERT INTO public.admin_audit_logs(admin_id, action, target_user_id, metadata)
  VALUES (
    v_admin_id,
    'admin_resend_verification',
    p_user_id,
    jsonb_build_object('group_id', p_group_id)
  );

  RETURN jsonb_build_object(
    'new_token',  v_new_token,
    'expires_at', v_expires
  );
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.admin_add_group_member(UUID,UUID,TEXT)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_group_member(UUID,UUID,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resend_verification(UUID,UUID)         TO authenticated;
