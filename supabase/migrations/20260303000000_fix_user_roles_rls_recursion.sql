-- =============================================================================
-- Fix infinite recursion in user_roles RLS policies (code: 42P17)
--
-- Root cause:
--   20260302000000_security_hardening.sql enabled RLS on user_roles, but the
--   existing policies call has_role(), which reads user_roles, which triggers
--   the policies again → infinite loop.
--
--   The intended fix (20260302100000_fix_has_role_recursion.sql) was never
--   applied because it shares a timestamp with add_quiz_leads.sql; Supabase
--   only tracks one migration per timestamp.
--
-- Fix:
--   1. Drop ALL policies on user_roles.
--   2. Create non-recursive policies that use auth.uid() directly.
--   3. Recreate has_role() as LANGUAGE plpgsql SECURITY DEFINER so it runs as
--      the function owner (postgres), bypassing user_roles RLS when called
--      from other tables' policies.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Drop every policy on user_roles (handles any name, including ones
-- created in the Supabase dashboard that don't appear in migration files).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM   pg_policies
    WHERE  schemaname = 'public'
      AND  tablename  = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Non-recursive policies for user_roles.
-- IMPORTANT: Never call has_role() here — that would recurse back into these
-- policies. Use auth.uid() directly instead.
-- ─────────────────────────────────────────────────────────────────────────────

-- Each user can read their own role entry (e.g. to know they're an admin).
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (server-side admin API) has full unrestricted access.
CREATE POLICY "Service role full access to user_roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Recreate has_role() as SECURITY DEFINER + LANGUAGE plpgsql.
--
-- SECURITY DEFINER → runs as the function owner (postgres/supabase_admin),
--   which bypasses RLS on user_roles entirely.
-- LANGUAGE plpgsql → the optimizer cannot inline the function body, so the
--   SECURITY DEFINER context is preserved at every call site.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM   public.user_roles
    WHERE  user_id = _user_id
      AND  role    = _role
  ) INTO _result;

  RETURN _result;
END;
$$;
