-- Fix infinite recursion in user_roles policies by converting has_role to plpgsql
-- LANGUAGE sql functions can be inlined by the optimizer, losing their SECURITY DEFINER context.
-- LANGUAGE plpgsql prevents inlining, ensuring the function correctly bypasses RLS.

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) INTO _has_role;
  
  RETURN _has_role;
END;
$$;
