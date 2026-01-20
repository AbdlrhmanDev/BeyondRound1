-- Create group_evaluations table for post-meeting surveys
CREATE TABLE IF NOT EXISTS public.group_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.match_groups(id) ON DELETE CASCADE,
  met_in_person BOOLEAN NOT NULL DEFAULT false,
  meeting_rating INTEGER CHECK (meeting_rating >= 1 AND meeting_rating <= 5),
  real_connection BOOLEAN,
  photos_urls TEXT[], -- Array of photo URLs
  feedback_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id) -- One evaluation per user per group
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS group_evaluations_user_id_idx ON public.group_evaluations(user_id);
CREATE INDEX IF NOT EXISTS group_evaluations_group_id_idx ON public.group_evaluations(group_id);
CREATE INDEX IF NOT EXISTS group_evaluations_submitted_at_idx ON public.group_evaluations(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.group_evaluations ENABLE ROW LEVEL SECURITY;

-- Users can view their own evaluations
CREATE POLICY "Users can view their own evaluations"
ON public.group_evaluations FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own evaluations
CREATE POLICY "Users can insert their own evaluations"
ON public.group_evaluations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own evaluations
CREATE POLICY "Users can update their own evaluations"
ON public.group_evaluations FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_group_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_evaluations_updated_at_trigger
  BEFORE UPDATE ON public.group_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_group_evaluations_updated_at();
