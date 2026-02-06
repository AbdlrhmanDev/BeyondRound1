-- Create polls table for group meetup planning
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_type TEXT NOT NULL CHECK (poll_type IN ('day', 'time', 'activity', 'place', 'custom')),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  is_multiple_choice BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_polls_conversation_id ON public.polls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_polls_creator_id ON public.polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Helper function to check group membership (reuse existing or create)
CREATE OR REPLACE FUNCTION is_group_conversation_member(conv_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_conversations gc
    JOIN public.match_groups mg ON gc.group_id = mg.id
    JOIN public.match_group_members mgm ON mg.id = mgm.group_id
    WHERE gc.id = conv_id AND mgm.user_id = user_id
  );
$$;

-- RLS Policies for polls
DROP POLICY IF EXISTS "Users can view polls in their group conversations" ON public.polls;
CREATE POLICY "Users can view polls in their group conversations"
ON public.polls FOR SELECT
USING (is_group_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can create polls in their group conversations" ON public.polls;
CREATE POLICY "Users can create polls in their group conversations"
ON public.polls FOR INSERT
WITH CHECK (
  creator_id = auth.uid() AND
  is_group_conversation_member(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Poll creators can update their polls" ON public.polls;
CREATE POLICY "Poll creators can update their polls"
ON public.polls FOR UPDATE
USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Poll creators can delete their polls" ON public.polls;
CREATE POLICY "Poll creators can delete their polls"
ON public.polls FOR DELETE
USING (creator_id = auth.uid());

-- RLS Policies for poll_votes
DROP POLICY IF EXISTS "Users can view votes on polls they can see" ON public.poll_votes;
CREATE POLICY "Users can view votes on polls they can see"
ON public.poll_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND is_group_conversation_member(p.conversation_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can vote on polls in their groups" ON public.poll_votes;
CREATE POLICY "Users can vote on polls in their groups"
ON public.poll_votes FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id
    AND NOT p.is_closed
    AND is_group_conversation_member(p.conversation_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can remove their own votes" ON public.poll_votes;
CREATE POLICY "Users can remove their own votes"
ON public.poll_votes FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- Add updated_at trigger for polls
CREATE OR REPLACE FUNCTION update_polls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_polls_updated_at ON public.polls;
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION update_polls_updated_at();
