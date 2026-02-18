-- Admin RPC Functions
-- All admin write operations use SECURITY DEFINER RPCs that atomically:
-- 1. Check has_role(auth.uid(), 'admin') permission
-- 2. Capture old state
-- 3. Perform the update(s)
-- 4. Insert audit log row
-- 5. Return result

-- ============================================================
-- VERIFICATION RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_approve_verification(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_profile JSONB;
  v_old_vr JSONB;
  v_vr_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  -- Capture old state
  SELECT jsonb_build_object('verification_status', verification_status)
    INTO v_old_profile FROM profiles WHERE user_id = p_user_id;

  SELECT id, jsonb_build_object('status', status, 'rejection_reason', rejection_reason)
    INTO v_vr_id, v_old_vr FROM verification_requests WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;

  IF v_vr_id IS NULL THEN
    RAISE EXCEPTION 'No verification request found for user %', p_user_id;
  END IF;

  -- Update profiles
  UPDATE profiles SET
    verification_status = 'approved'
  WHERE user_id = p_user_id;

  -- Update verification_requests
  UPDATE verification_requests SET
    status = 'approved',
    rejection_reason = CASE WHEN p_reason IS NOT NULL THEN p_reason ELSE rejection_reason END
  WHERE id = v_vr_id;

  -- Audit log
  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'approve_verification', p_user_id, 'verification_requests', v_vr_id,
    v_old_vr, jsonb_build_object('status', 'approved', 'verification_status', 'approved'),
    COALESCE(p_reason, 'Approved')
  );

  RETURN jsonb_build_object('success', true, 'verification_request_id', v_vr_id);
END;
$$;

CREATE OR REPLACE FUNCTION admin_reject_verification(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_profile JSONB;
  v_old_vr JSONB;
  v_vr_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for rejection';
  END IF;

  SELECT jsonb_build_object('verification_status', verification_status)
    INTO v_old_profile FROM profiles WHERE user_id = p_user_id;

  SELECT id, jsonb_build_object('status', status, 'rejection_reason', rejection_reason)
    INTO v_vr_id, v_old_vr FROM verification_requests WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;

  IF v_vr_id IS NULL THEN
    RAISE EXCEPTION 'No verification request found for user %', p_user_id;
  END IF;

  UPDATE profiles SET verification_status = 'rejected' WHERE user_id = p_user_id;

  UPDATE verification_requests SET
    status = 'rejected',
    rejection_reason = p_reason
  WHERE id = v_vr_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'reject_verification', p_user_id, 'verification_requests', v_vr_id,
    v_old_vr, jsonb_build_object('status', 'rejected', 'verification_status', 'rejected'),
    p_reason
  );

  RETURN jsonb_build_object('success', true, 'verification_request_id', v_vr_id);
END;
$$;

CREATE OR REPLACE FUNCTION admin_request_reupload(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_vr JSONB;
  v_vr_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for reupload request';
  END IF;

  SELECT id, jsonb_build_object('status', status, 'rejection_reason', rejection_reason)
    INTO v_vr_id, v_old_vr FROM verification_requests WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;

  IF v_vr_id IS NULL THEN
    RAISE EXCEPTION 'No verification request found for user %', p_user_id;
  END IF;

  -- Keep profiles.verification_status as 'pending'
  UPDATE profiles SET verification_status = 'pending' WHERE user_id = p_user_id;

  UPDATE verification_requests SET
    status = 'rejected',
    rejection_reason = 'REUPLOAD_REQUESTED: ' || p_reason
  WHERE id = v_vr_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'request_reupload', p_user_id, 'verification_requests', v_vr_id,
    v_old_vr, jsonb_build_object('status', 'rejected', 'rejection_reason', 'REUPLOAD_REQUESTED: ' || p_reason),
    p_reason
  );

  RETURN jsonb_build_object('success', true, 'verification_request_id', v_vr_id);
END;
$$;

-- ============================================================
-- USER MANAGEMENT RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
  v_profile_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT id, jsonb_build_object('status', status, 'banned_at', banned_at, 'ban_reason', ban_reason)
    INTO v_profile_id, v_old FROM profiles WHERE user_id = p_user_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  UPDATE profiles SET
    status = 'banned',
    banned_at = NOW(),
    ban_reason = p_reason
  WHERE user_id = p_user_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'user_ban', p_user_id, 'profiles', v_profile_id,
    v_old, jsonb_build_object('status', 'banned', 'banned_at', NOW(), 'ban_reason', p_reason),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_unban_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Unbanned by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
  v_profile_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT id, jsonb_build_object('status', status, 'banned_at', banned_at, 'ban_reason', ban_reason)
    INTO v_profile_id, v_old FROM profiles WHERE user_id = p_user_id;

  UPDATE profiles SET
    status = 'active',
    banned_at = NULL,
    ban_reason = NULL
  WHERE user_id = p_user_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'user_unban', p_user_id, 'profiles', v_profile_id,
    v_old, jsonb_build_object('status', 'active', 'banned_at', NULL, 'ban_reason', NULL),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_soft_delete_user(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('soft_delete', soft_delete)
    INTO v_old FROM profiles WHERE user_id = p_user_id;

  UPDATE profiles SET soft_delete = TRUE WHERE user_id = p_user_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'soft_delete_user', p_user_id, 'profiles',
    v_old, jsonb_build_object('soft_delete', true),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_restore_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Restored by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('soft_delete', soft_delete)
    INTO v_old FROM profiles WHERE user_id = p_user_id;

  UPDATE profiles SET soft_delete = FALSE WHERE user_id = p_user_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'restore_user', p_user_id, 'profiles',
    v_old, jsonb_build_object('soft_delete', false),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_change_role(
  p_user_id UUID,
  p_new_role TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_role TEXT;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT role INTO v_old_role FROM user_roles WHERE user_id = p_user_id;

  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_new_role::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = p_new_role::app_role;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'change_role', p_user_id, 'user_roles',
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_new_role),
    p_reason
  );

  RETURN jsonb_build_object('success', true, 'old_role', v_old_role, 'new_role', p_new_role);
END;
$$;

-- ============================================================
-- REPORT RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_update_report(
  p_report_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
  v_target_user_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') AND NOT has_role(v_admin_id, 'moderator') THEN
    RAISE EXCEPTION 'Permission denied: admin or moderator role required';
  END IF;

  SELECT jsonb_build_object('status', status), reported_id
    INTO v_old, v_target_user_id FROM user_reports WHERE id = p_report_id;

  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Report not found: %', p_report_id;
  END IF;

  UPDATE user_reports SET
    status = p_status
  WHERE id = p_report_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'update_report', v_target_user_id, 'user_reports', p_report_id,
    v_old, jsonb_build_object('status', p_status),
    'Report status updated to ' || p_status
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- GROUP/CHAT MODERATION RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_delete_message(
  p_message_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
  v_sender_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') AND NOT has_role(v_admin_id, 'moderator') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT jsonb_build_object('content', content, 'deleted_at', deleted_at), sender_id
    INTO v_old, v_sender_id FROM group_messages WHERE id = p_message_id;

  UPDATE group_messages SET
    deleted_at = NOW(),
    content = '[Message deleted by admin]'
  WHERE id = p_message_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'delete_message', v_sender_id, 'group_messages', p_message_id,
    v_old, jsonb_build_object('deleted_at', NOW()),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_remove_from_group(
  p_group_id UUID,
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  DELETE FROM group_members WHERE group_id = p_group_id AND user_id = p_user_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'remove_from_group', p_user_id, 'group_members', p_group_id,
    jsonb_build_object('group_id', p_group_id, 'user_id', p_user_id),
    jsonb_build_object('removed', true),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_disband_group(
  p_group_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('status', status) INTO v_old FROM match_groups WHERE id = p_group_id;

  UPDATE match_groups SET status = 'disbanded' WHERE id = p_group_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'disband_group', 'match_groups', p_group_id,
    v_old, jsonb_build_object('status', 'disbanded'),
    p_reason
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_send_system_message(
  p_group_id UUID,
  p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_conversation_id UUID;
  v_message_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT id INTO v_conversation_id FROM group_conversations WHERE group_id = p_group_id LIMIT 1;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'No conversation found for group %', p_group_id;
  END IF;

  INSERT INTO group_messages (conversation_id, sender_id, content, is_bot)
  VALUES (v_conversation_id, v_admin_id, p_content, true)
  RETURNING id INTO v_message_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, new_values, reason)
  VALUES (
    v_admin_id, 'send_system_message', 'group_messages', v_message_id,
    jsonb_build_object('group_id', p_group_id, 'content', p_content),
    'System message sent'
  );

  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- ============================================================
-- EVENT RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION admin_cancel_event(
  p_event_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
  v_cancelled_bookings INT;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('status', status) INTO v_old FROM events WHERE id = p_event_id;

  UPDATE events SET status = 'cancelled' WHERE id = p_event_id;

  UPDATE bookings SET status = 'cancelled' WHERE event_id = p_event_id AND status != 'cancelled';
  GET DIAGNOSTICS v_cancelled_bookings = ROW_COUNT;

  INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'cancel_event', 'events', p_event_id,
    v_old, jsonb_build_object('status', 'cancelled', 'cancelled_bookings', v_cancelled_bookings),
    p_reason
  );

  RETURN jsonb_build_object('success', true, 'cancelled_bookings', v_cancelled_bookings);
END;
$$;

CREATE OR REPLACE FUNCTION admin_close_event(
  p_event_id UUID,
  p_reason TEXT DEFAULT 'Closed by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('status', status) INTO v_old FROM events WHERE id = p_event_id;
  UPDATE events SET status = 'closed' WHERE id = p_event_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, old_values, new_values, reason)
  VALUES (v_admin_id, 'close_event', 'events', p_event_id, v_old, jsonb_build_object('status', 'closed'), p_reason);

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_reopen_event(
  p_event_id UUID,
  p_reason TEXT DEFAULT 'Reopened by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('status', status) INTO v_old FROM events WHERE id = p_event_id;
  UPDATE events SET status = 'open' WHERE id = p_event_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, old_values, new_values, reason)
  VALUES (v_admin_id, 'reopen_event', 'events', p_event_id, v_old, jsonb_build_object('status', 'open'), p_reason);

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_cancel_booking(
  p_booking_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
  v_user_id UUID;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('status', status), user_id INTO v_old, v_user_id FROM bookings WHERE id = p_booking_id;
  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, target_table, target_id, old_values, new_values, reason)
  VALUES (v_admin_id, 'cancel_booking', v_user_id, 'bookings', p_booking_id, v_old, jsonb_build_object('status', 'cancelled'), p_reason);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- APP CONFIG RPC
-- ============================================================

CREATE OR REPLACE FUNCTION admin_update_app_config(
  p_key TEXT,
  p_value TEXT,
  p_reason TEXT DEFAULT 'Config updated'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old_value TEXT;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT value INTO v_old_value FROM app_config WHERE key = p_key;

  INSERT INTO app_config (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key) DO UPDATE SET value = p_value, updated_at = NOW();

  INSERT INTO admin_audit_logs (admin_id, action, target_table, old_values, new_values, reason)
  VALUES (
    v_admin_id, 'update_app_config', 'app_config',
    jsonb_build_object('key', p_key, 'value', v_old_value),
    jsonb_build_object('key', p_key, 'value', p_value),
    p_reason
  );

  RETURN jsonb_build_object('success', true, 'old_value', v_old_value, 'new_value', p_value);
END;
$$;

-- ============================================================
-- FEEDBACK DELETE RPC (with audit)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_delete_feedback(
  p_feedback_id UUID,
  p_reason TEXT DEFAULT 'Feedback deleted'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_old JSONB;
BEGIN
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT jsonb_build_object('category', category, 'message', message, 'user_id', user_id)
    INTO v_old FROM feedback WHERE id = p_feedback_id;

  DELETE FROM feedback WHERE id = p_feedback_id;

  INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, old_values, reason)
  VALUES (v_admin_id, 'delete_feedback', 'feedback', p_feedback_id, v_old, p_reason);

  RETURN jsonb_build_object('success', true);
END;
$$;
