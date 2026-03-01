-- ============================================================
-- Auto-create verification_requests when a doctor uploads
-- their license during onboarding (profiles.license_url set).
-- Also backfills existing users who already have a license_url.
-- ============================================================

-- 1. Trigger function
CREATE OR REPLACE FUNCTION public.auto_create_verification_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- Fire when license_url transitions from NULL/empty to a real value
  IF (OLD.license_url IS NULL OR OLD.license_url = '')
     AND (NEW.license_url IS NOT NULL AND NEW.license_url <> '')
  THEN
    -- Only insert if no active (pending/approved) request already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.verification_requests
      WHERE user_id = NEW.user_id
        AND status IN ('pending', 'approved')
    ) THEN
      INSERT INTO public.verification_requests
        (user_id, document_type, file_url, status)
      VALUES
        (NEW.user_id, 'medical_license', NEW.license_url, 'pending');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_verification_request ON public.profiles;
CREATE TRIGGER trg_auto_verification_request
  AFTER UPDATE OF license_url ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_verification_request();

-- 2. Backfill: create rows for existing users with a license_url
--    Respect the existing verification_status already on profiles
INSERT INTO public.verification_requests (user_id, document_type, file_url, status)
SELECT
  p.user_id,
  'medical_license',
  p.license_url,
  CASE
    WHEN p.verification_status = 'approved'  THEN 'approved'
    WHEN p.verification_status = 'rejected'  THEN 'rejected'
    ELSE 'pending'
  END
FROM public.profiles p
WHERE p.license_url IS NOT NULL
  AND p.license_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.verification_requests vr
    WHERE vr.user_id = p.user_id
  );
