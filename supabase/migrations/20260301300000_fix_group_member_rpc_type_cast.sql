-- ============================================================
-- Fix: explicit app_role cast in all group-management RPCs
-- Root cause: has_role(_user_id uuid, _role app_role) requires
--   an app_role value; bare string literals in PL/pgSQL resolve
--   as text, causing "operator does not exist: text = app_role"
-- ============================================================

-- 1. admin_add_group_member
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
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
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

-- 2. admin_verify_group_member
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
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
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
    'status',            p_decision,
    'membership_status', CASE p_decision WHEN 'verified' THEN 'active' ELSE 'removed' END
  );
END;
$$;

-- 3. admin_resend_verification
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
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
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

-- 4. admin_get_pairwise_scores
CREATE OR REPLACE FUNCTION public.admin_get_pairwise_scores(p_group_id UUID)
RETURNS TABLE(user_a_id UUID, user_b_id UUID, score NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_members UUID[];
  i INT;
  j INT;
  v_score NUMERIC;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Collect active member IDs
  SELECT ARRAY_AGG(gm.user_id ORDER BY gm.user_id)
  INTO v_members
  FROM public.group_members gm
  WHERE gm.group_id = p_group_id
    AND (gm.status IS NULL OR gm.status = 'active');

  IF v_members IS NULL OR array_length(v_members, 1) < 2 THEN
    RETURN;
  END IF;

  -- Emit every unique pair (a < b by array index)
  FOR i IN 1 .. array_length(v_members, 1) - 1 LOOP
    FOR j IN (i + 1) .. array_length(v_members, 1) LOOP
      v_score   := calculate_match_score(v_members[i], v_members[j]);
      user_a_id := v_members[i];
      user_b_id := v_members[j];
      score     := v_score;
      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$;

-- Re-grant execute (no-op if already granted, safe to repeat)
GRANT EXECUTE ON FUNCTION public.admin_add_group_member(UUID,UUID,TEXT)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_group_member(UUID,UUID,TEXT,TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resend_verification(UUID,UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_pairwise_scores(UUID)                 TO authenticated;
