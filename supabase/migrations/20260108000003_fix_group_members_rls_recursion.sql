-- Fix infinite recursion in group_members RLS policy
-- The original policy was querying group_members from within its own policy check,
-- causing infinite recursion. We'll use a security definer function instead.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

-- Create a security definer function to check group membership
-- This bypasses RLS when checking membership, preventing recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
  );
$$;

-- Create new RLS policy using the security definer function
-- This prevents infinite recursion because the function bypasses RLS
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see members of groups they belong to (using security definer function)
    public.is_group_member(group_id, auth.uid())
  );

-- Also fix the match_groups policy to use the function to prevent potential issues
DROP POLICY IF EXISTS "Users can view their groups" ON public.match_groups;

CREATE POLICY "Users can view their groups" ON public.match_groups
  FOR SELECT USING (
    public.is_group_member(id, auth.uid())
  );

-- Update group_conversations policy to use the function for consistency
DROP POLICY IF EXISTS "Users can view group conversations" ON public.group_conversations;

CREATE POLICY "Users can view group conversations" ON public.group_conversations
  FOR SELECT USING (
    public.is_group_member(group_id, auth.uid())
  );

-- Update group_messages policies to use the function for consistency
DROP POLICY IF EXISTS "Users can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can send group messages" ON public.group_messages;

CREATE POLICY "Users can view group messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_conversations gc
      WHERE gc.id = group_messages.conversation_id 
      AND public.is_group_member(gc.group_id, auth.uid())
    )
  );

CREATE POLICY "Users can send group messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.group_conversations gc
      WHERE gc.id = group_messages.conversation_id 
      AND public.is_group_member(gc.group_id, auth.uid())
    )
  );
