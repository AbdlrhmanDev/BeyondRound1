-- Fix RLS policies for group_messages table
-- Ensures the security definer function exists and policies are correct

-- Create or replace the security definer function to check group membership
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO anon;

-- Drop existing group_messages policies
DROP POLICY IF EXISTS "Users can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can send group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can update own group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can delete own group messages" ON public.group_messages;

-- Recreate SELECT policy
CREATE POLICY "Users can view group messages" ON public.group_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_conversations gc
      WHERE gc.id = group_messages.conversation_id
      AND public.is_group_member(gc.group_id, auth.uid())
    )
  );

-- Recreate INSERT policy
CREATE POLICY "Users can send group messages" ON public.group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_conversations gc
      WHERE gc.id = conversation_id
      AND public.is_group_member(gc.group_id, auth.uid())
    )
  );

-- Add UPDATE policy for editing own messages
CREATE POLICY "Users can update own group messages" ON public.group_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Add DELETE policy for deleting own messages
CREATE POLICY "Users can delete own group messages" ON public.group_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Also ensure group_members policy exists
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
  );

-- Ensure group_conversations policy exists
DROP POLICY IF EXISTS "Users can view group conversations" ON public.group_conversations;

CREATE POLICY "Users can view group conversations" ON public.group_conversations
  FOR SELECT
  TO authenticated
  USING (
    public.is_group_member(group_id, auth.uid())
  );

-- Enable realtime for group_messages (idempotent)
DO $$
BEGIN
  -- Check if table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;
END $$;

-- Set replica identity to FULL for better realtime updates
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
