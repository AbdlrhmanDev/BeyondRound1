-- Create matches table for the matching system
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  matched_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  match_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, matched_user_id)
);

-- Create conversations table for chat
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Matches policies
CREATE POLICY "Users can view their own matches"
ON public.matches FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create matches"
ON public.matches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their received matches"
ON public.matches FOR UPDATE
USING (auth.uid() = matched_user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = conversations.match_id 
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
  )
);

CREATE POLICY "Users can create conversations for their matches"
ON public.conversations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = match_id 
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
    AND matches.status = 'accepted'
  )
);

-- Add RLS policy for profiles to allow viewing other users' profiles for matches
CREATE POLICY "Users can view profiles of matched users"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (matches.user_id = auth.uid() AND matches.matched_user_id = profiles.user_id)
       OR (matches.matched_user_id = auth.uid() AND matches.user_id = profiles.user_id)
  )
);

-- Add RLS policy for onboarding_preferences to allow viewing for matches
CREATE POLICY "Users can view preferences of matched users"
ON public.onboarding_preferences FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.matches 
    WHERE (matches.user_id = auth.uid() AND matches.matched_user_id = onboarding_preferences.user_id)
       OR (matches.matched_user_id = auth.uid() AND matches.user_id = onboarding_preferences.user_id)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();