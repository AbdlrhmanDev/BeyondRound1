-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'match_accepted', 'match_rejected', 'group_invite', 'group_message', 'message', 'event', 'welcome', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Optional link to navigate to (e.g., /matches, /chat/:id)
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb -- Store additional data like match_id, group_id, etc.
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Function to create notification when match is created
CREATE OR REPLACE FUNCTION public.create_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the matched user
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    NEW.matched_user_id,
    'match',
    'New Connection Request',
    'You have a new connection request from ' || (SELECT full_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1) || '.',
    '/matches',
    jsonb_build_object('match_id', NEW.id, 'from_user_id', NEW.user_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new matches
DROP TRIGGER IF EXISTS on_match_created ON public.matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.create_match_notification();

-- Function to create notification when match is accepted
CREATE OR REPLACE FUNCTION public.create_match_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Notify the user who sent the request
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.user_id,
      'match_accepted',
      'Connection Accepted!',
      (SELECT full_name FROM public.profiles WHERE user_id = NEW.matched_user_id LIMIT 1) || ' accepted your connection request.',
      '/chat/' || (SELECT id FROM public.conversations WHERE match_id = NEW.id LIMIT 1),
      jsonb_build_object('match_id', NEW.id, 'matched_user_id', NEW.matched_user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for match status updates
DROP TRIGGER IF EXISTS on_match_updated ON public.matches;
CREATE TRIGGER on_match_updated
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_accepted_notification();

-- Function to create notification when user joins a group
CREATE OR REPLACE FUNCTION public.create_group_join_notification()
RETURNS TRIGGER AS $$
DECLARE
  group_name TEXT;
  group_members_count INTEGER;
BEGIN
  -- Get group name
  SELECT name INTO group_name FROM public.match_groups WHERE id = NEW.group_id;
  
  -- Get member count
  SELECT COUNT(*) INTO group_members_count FROM public.group_members WHERE group_id = NEW.group_id;
  
  -- Notify other group members
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  SELECT 
    gm.user_id,
    'group_invite',
    'New Member Joined',
    (SELECT full_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1) || ' joined ' || COALESCE(group_name, 'your group') || '.',
    '/group-chat/' || (SELECT id FROM public.group_conversations WHERE group_id = NEW.group_id LIMIT 1),
    jsonb_build_object('group_id', NEW.group_id, 'new_member_id', NEW.user_id)
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id AND gm.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new group members
DROP TRIGGER IF EXISTS on_group_member_joined ON public.group_members;
CREATE TRIGGER on_group_member_joined
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.create_group_join_notification();

-- Function to create notification for new one-on-one messages
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_match_id UUID;
BEGIN
  -- Get the match_id from conversation
  SELECT match_id INTO conversation_match_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Get the recipient from the match (the other user)
  IF conversation_match_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN m.user_id = NEW.sender_id THEN m.matched_user_id
        ELSE m.user_id
      END
    INTO recipient_id
    FROM public.matches m
    WHERE m.id = conversation_match_id;
  END IF;
  
  -- Get sender name
  SELECT full_name INTO sender_name 
  FROM public.profiles 
  WHERE user_id = NEW.sender_id 
  LIMIT 1;
  
  -- Only notify if recipient exists and is not the sender
  IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      recipient_id,
      'message',
      'New Message',
      COALESCE(sender_name, 'Someone') || ' sent you a message.',
      '/chat/' || NEW.conversation_id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new one-on-one messages
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.is_deleted IS NOT TRUE)
  EXECUTE FUNCTION public.create_message_notification();

-- Function to create notification for new group messages
CREATE OR REPLACE FUNCTION public.create_group_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  group_id_val UUID;
  sender_name TEXT;
BEGIN
  -- Get group_id from conversation
  SELECT gc.group_id INTO group_id_val
  FROM public.group_conversations gc
  WHERE gc.id = NEW.conversation_id;
  
  -- Get sender name
  SELECT full_name INTO sender_name 
  FROM public.profiles 
  WHERE user_id = NEW.sender_id 
  LIMIT 1;
  
  -- Notify all group members except the sender
  IF group_id_val IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    SELECT 
      gm.user_id,
      'group_message',
      'New Group Message',
      COALESCE(sender_name, 'Someone') || ' sent a message in the group.',
      '/group-chat/' || NEW.conversation_id,
      jsonb_build_object('conversation_id', NEW.conversation_id, 'group_id', group_id_val, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
    FROM public.group_members gm
    WHERE gm.group_id = group_id_val AND gm.user_id != NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new group messages
DROP TRIGGER IF EXISTS on_group_message_created ON public.group_messages;
CREATE TRIGGER on_group_message_created
  AFTER INSERT ON public.group_messages
  FOR EACH ROW
  WHEN (NEW.is_deleted IS NOT TRUE)
  EXECUTE FUNCTION public.create_group_message_notification();

-- Enable realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
