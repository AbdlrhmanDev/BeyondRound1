-- ============================================================
-- Fix: explicit app_role cast in verification admin RPCs
-- Root cause: has_role(_user_id uuid, _role app_role) requires
--   an app_role value; bare string literals in PL/pgSQL resolve
--   as text, causing "operator does not exist: text = app_role"
-- ============================================================

-- 1. admin_delete_verification_request
CREATE OR REPLACE FUNCTION public.admin_delete_verification_request(p_request_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_request  RECORD;
BEGIN
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO v_request FROM verification_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  DELETE FROM verification_requests WHERE id = p_request_id;

  -- Reset profile verification_status so the user can re-submit
  UPDATE profiles SET verification_status = NULL
  WHERE user_id = v_request.user_id;

  INSERT INTO admin_audit_logs(admin_id, action, target_user_id, metadata)
  VALUES (v_admin_id, 'delete_verification_request', v_request.user_id,
    jsonb_build_object('request_id', p_request_id, 'status', v_request.status));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. admin_create_verification_request
CREATE OR REPLACE FUNCTION public.admin_create_verification_request(
  p_user_id      UUID,
  p_document_type TEXT DEFAULT 'medical_license',
  p_file_url      TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_new_id   UUID;
  v_file_url TEXT;
BEGIN
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- Use provided URL or fall back to license already on profile
  v_file_url := COALESCE(p_file_url,
    (SELECT license_url FROM profiles WHERE user_id = p_user_id));

  -- Upsert: create new or reset rejected request to pending
  INSERT INTO verification_requests(user_id, document_type, file_url, status)
  VALUES (p_user_id, p_document_type, v_file_url, 'pending')
  ON CONFLICT (user_id) DO UPDATE SET
    document_type    = EXCLUDED.document_type,
    file_url         = COALESCE(EXCLUDED.file_url, verification_requests.file_url),
    status           = 'pending',
    rejection_reason = NULL,
    updated_at       = now()
  RETURNING id INTO v_new_id;

  UPDATE profiles SET verification_status = 'pending' WHERE user_id = p_user_id;

  INSERT INTO admin_audit_logs(admin_id, action, target_user_id, metadata)
  VALUES (v_admin_id, 'create_verification_request', p_user_id,
    jsonb_build_object('request_id', v_new_id, 'document_type', p_document_type));

  RETURN jsonb_build_object('success', true, 'request_id', v_new_id);
END;
$$;

-- Re-grant execute (no-op if already granted, safe to repeat)
GRANT EXECUTE ON FUNCTION public.admin_delete_verification_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_verification_request(UUID, TEXT, TEXT) TO authenticated;

-- Fix storage policy: drop and recreate with explicit cast to be safe
DROP POLICY IF EXISTS "Admins can view all licenses" ON storage.objects;
CREATE POLICY "Admins can view all licenses"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'licenses' AND public.has_role(auth.uid(), 'admin'::public.app_role));
