-- Enable profile discovery for the Discover page
-- Users should be able to browse profiles of other users who have completed onboarding
-- This allows the Discover page to show potential matches

-- Allow users to view profiles of other users who have completed onboarding
-- This is for discovery/browsing purposes
CREATE POLICY "Users can discover profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      -- Only show profiles of users who have completed onboarding
      SELECT 1 FROM public.onboarding_preferences
      WHERE onboarding_preferences.user_id = profiles.user_id
        AND onboarding_preferences.completed_at IS NOT NULL
    )
  );

-- Allow users to view preferences of other users for discovery
-- Only if they have completed onboarding
CREATE POLICY "Users can discover preferences" ON public.onboarding_preferences
  FOR SELECT USING (
    auth.uid() = user_id
    OR completed_at IS NOT NULL
  );
