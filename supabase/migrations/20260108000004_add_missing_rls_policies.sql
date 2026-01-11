-- Add missing RLS policies for group_conversations INSERT
-- Users should be able to create conversations for groups they're members of

CREATE POLICY "Users can create group conversations" ON public.group_conversations
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id, auth.uid())
  );

-- Also add UPDATE policy for group_conversations (if needed in future)
CREATE POLICY "Users can update group conversations" ON public.group_conversations
  FOR UPDATE USING (
    public.is_group_member(group_id, auth.uid())
  );

-- Create a security definer function to check if two users are in the same group
-- This avoids RLS recursion issues
CREATE OR REPLACE FUNCTION public.are_in_same_group(_user_a_id UUID, _user_b_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false if either user_id is null
  IF _user_a_id IS NULL OR _user_b_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if both users are in the same group
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = _user_a_id
      AND gm2.user_id = _user_b_id
  );
END;
$$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view profiles of group members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view preferences of group members" ON public.onboarding_preferences;

-- Add RLS policies to allow users to view profiles of group members
-- Users should be able to see profiles of other users in their groups
-- Note: Multiple SELECT policies are combined with OR, so this adds to existing policies
CREATE POLICY "Users can view profiles of group members" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.are_in_same_group(auth.uid(), user_id)
  );

-- Add RLS policies to allow users to view preferences of group members
-- Note: Multiple SELECT policies are combined with OR, so this adds to existing policies
CREATE POLICY "Users can view preferences of group members" ON public.onboarding_preferences
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.are_in_same_group(auth.uid(), user_id)
  );
