-- Create match_groups table for group-based matching
CREATE TABLE public.match_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  group_type TEXT NOT NULL CHECK (group_type IN ('mixed', 'same_gender')),
  gender_composition TEXT, -- e.g., '2F3M', '3F2M', 'all_male', 'all_female'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disbanded', 'pending')),
  match_week DATE NOT NULL, -- The Thursday when this group was formed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members junction table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.match_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_conversations table
CREATE TABLE public.group_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.match_groups(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_messages table
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add city column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE public.profiles ADD COLUMN city TEXT;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.match_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS for match_groups: Users can view groups they're members of
CREATE POLICY "Users can view their groups" ON public.match_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = match_groups.id 
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS for group_members: Users can view members of their groups
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members AS gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid()
    )
  );

-- RLS for group_conversations: Users can view conversations of their groups
CREATE POLICY "Users can view group conversations" ON public.group_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = group_conversations.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS for group_messages: Users can view and insert messages in their group conversations
CREATE POLICY "Users can view group messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_conversations gc
      JOIN public.group_members gm ON gm.group_id = gc.group_id
      WHERE gc.id = group_messages.conversation_id 
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send group messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.group_conversations gc
      JOIN public.group_members gm ON gm.group_id = gc.group_id
      WHERE gc.id = group_messages.conversation_id 
      AND gm.user_id = auth.uid()
    )
  );

-- Enable realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create trigger for updated_at on match_groups
CREATE TRIGGER update_match_groups_updated_at
  BEFORE UPDATE ON public.match_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();