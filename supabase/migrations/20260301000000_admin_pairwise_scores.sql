-- ============================================================
-- Admin: Pairwise Compatibility Scores
-- Exposes calculate_match_score for each active member pair
-- in a group, bypassing RLS via SECURITY DEFINER.
-- ============================================================

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
  IF NOT has_role(auth.uid(), 'admin') THEN
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
      v_score := calculate_match_score(v_members[i], v_members[j]);
      user_a_id := v_members[i];
      user_b_id := v_members[j];
      score     := v_score;
      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_pairwise_scores(UUID) TO authenticated;
