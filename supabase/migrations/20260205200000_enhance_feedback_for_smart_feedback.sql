-- Enhance feedback table for Smart Feedback feature
-- Adds structured fields for rating, chips, and context

-- Add new columns to existing feedback table
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS feedback_chips TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.match_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS meetup_id UUID,
ADD COLUMN IF NOT EXISTS additional_text TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_context_type ON public.feedback(context_type);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_group_id ON public.feedback(group_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.feedback.rating IS 'User rating 1-5 (emoji scale: Poor to Great)';
COMMENT ON COLUMN public.feedback.feedback_chips IS 'Array of selected feedback chip IDs';
COMMENT ON COLUMN public.feedback.context_type IS 'Context: group_completed, after_meetup, profile_suggestion, general';
COMMENT ON COLUMN public.feedback.group_id IS 'Reference to match_groups if feedback is about a group';
COMMENT ON COLUMN public.feedback.meetup_id IS 'Reference to meetup/evaluation if feedback is about a meetup';
COMMENT ON COLUMN public.feedback.additional_text IS 'Optional additional text feedback';

-- Create a view for feedback analytics (admin use)
CREATE OR REPLACE VIEW public.feedback_analytics AS
SELECT
  context_type,
  rating,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM public.feedback
WHERE rating IS NOT NULL
GROUP BY context_type, rating, DATE_TRUNC('day', created_at)
ORDER BY date DESC, context_type, rating;

-- Grant access to the view for authenticated users (admin check should be in app)
GRANT SELECT ON public.feedback_analytics TO authenticated;
