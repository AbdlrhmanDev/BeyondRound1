-- Add is_partial_group column to match_groups table
-- This marks groups that have fewer than 5 members
ALTER TABLE public.match_groups 
ADD COLUMN IF NOT EXISTS is_partial_group BOOLEAN DEFAULT false;

-- Create matching_waitlist table for tracking unmatched users
CREATE TABLE IF NOT EXISTS public.matching_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_week DATE NOT NULL,
  priority INTEGER DEFAULT 1, -- Higher = more priority (increases each week unmatched)
  reason TEXT, -- Why they weren't matched (e.g., 'insufficient_users', 'gender_imbalance')
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_week)
);

-- Enable RLS on waitlist
ALTER TABLE public.matching_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view their own waitlist entry"
ON public.matching_waitlist FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries"
ON public.matching_waitlist FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_waitlist_user_week ON public.matching_waitlist(user_id, match_week);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON public.matching_waitlist(priority DESC, match_week);

-- Function to get users from waitlist with priority
CREATE OR REPLACE FUNCTION public.get_waitlist_users_for_matching(target_week DATE)
RETURNS TABLE (
  user_id UUID,
  priority INTEGER,
  gender TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.user_id,
    w.priority,
    p.gender
  FROM public.matching_waitlist w
  JOIN public.profiles p ON p.user_id = w.user_id
  WHERE w.match_week < target_week
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.group_members gm
      JOIN public.match_groups mg ON mg.id = gm.group_id
      WHERE gm.user_id = w.user_id
        AND mg.match_week = target_week
        AND mg.status = 'active'
    )
  ORDER BY w.priority DESC, w.match_week ASC;
END;
$$;
