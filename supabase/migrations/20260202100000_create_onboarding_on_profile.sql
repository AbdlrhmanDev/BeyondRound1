-- Create onboarding_preferences row when profile is created
-- Fixes FK error when saving preferences for new users (row must exist for upsert to work)

CREATE OR REPLACE FUNCTION public.handle_profile_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.onboarding_preferences (user_id, completed_at)
  VALUES (NEW.user_id, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating onboarding_preferences for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_created();

-- Backfill: create onboarding_preferences for existing profiles that don't have one
INSERT INTO public.onboarding_preferences (user_id, completed_at)
SELECT p.user_id, NULL
FROM public.profiles p
LEFT JOIN public.onboarding_preferences op ON op.user_id = p.user_id
WHERE op.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
