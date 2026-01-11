-- Create ENUMs for new tables
CREATE TYPE public.user_goal_type AS ENUM (
  'career_advancement',
  'networking',
  'friendship',
  'mentorship',
  'collaboration',
  'learning',
  'social_activities',
  'business_opportunities'
);

CREATE TYPE public.interest_category AS ENUM (
  'sports',
  'music',
  'movies',
  'travel',
  'food',
  'technology',
  'art',
  'reading',
  'fitness',
  'gaming',
  'photography',
  'volunteering',
  'business',
  'education'
);

-- Create algorithm_audit_log table
CREATE TABLE IF NOT EXISTS public.algorithm_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  user_1_id uuid NOT NULL,
  user_2_id uuid NOT NULL,
  input_features jsonb NOT NULL,
  compatibility_score numeric NOT NULL,
  weight_interests numeric,
  weight_specialty numeric,
  weight_location numeric,
  weight_availability numeric,
  algorithm_version text,
  calculated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT algorithm_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT algorithm_audit_log_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE
);

-- Create match_feedback table
CREATE TABLE IF NOT EXISTS public.match_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  met_in_person boolean DEFAULT false,
  would_recommend boolean,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT match_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT match_feedback_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE,
  CONSTRAINT match_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create match_quality_metrics table
CREATE TABLE IF NOT EXISTS public.match_quality_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE,
  messages_exchanged integer DEFAULT 0,
  days_active integer,
  conversation_quality_score numeric DEFAULT 0,
  compatibility_score numeric,
  algorithm_version text,
  calculated_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT match_quality_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT match_quality_metrics_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE
);

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(blocker_id, blocked_id)
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal user_goal_type NOT NULL,
  priority integer CHECK (priority >= 1 AND priority <= 5),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_goals_pkey PRIMARY KEY (id),
  CONSTRAINT user_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type = ANY (ARRAY['message_sent'::text, 'met_in_person'::text, 'blocked'::text, 'reported'::text, 'matched'::text])),
  match_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_interactions_initiator_id_fkey FOREIGN KEY (initiator_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_interactions_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_interactions_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE SET NULL
);

-- Create user_interests table
CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  category interest_category NOT NULL,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_interests_pkey PRIMARY KEY (id),
  CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create user_reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text])),
  admin_notes text,
  created_at timestamp without time zone DEFAULT now(),
  reviewed_at timestamp without time zone,
  CONSTRAINT user_reports_pkey PRIMARY KEY (id),
  CONSTRAINT user_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on all new tables
ALTER TABLE public.algorithm_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for algorithm_audit_log (admins only)
CREATE POLICY "Admins can view algorithm audit logs"
ON public.algorithm_audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for match_feedback
CREATE POLICY "Users can view their own match feedback"
ON public.match_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own match feedback"
ON public.match_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all match feedback"
ON public.match_feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for match_quality_metrics (admins and matched users)
CREATE POLICY "Users can view quality metrics for their matches"
ON public.match_quality_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = match_quality_metrics.match_id
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
  )
);

CREATE POLICY "Admins can view all quality metrics"
ON public.match_quality_metrics FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_blocks
CREATE POLICY "Users can view blocks they created"
ON public.user_blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
ON public.user_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
ON public.user_blocks FOR DELETE
USING (auth.uid() = blocker_id);

CREATE POLICY "Admins can view all blocks"
ON public.user_blocks FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals"
ON public.user_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals"
ON public.user_goals FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for user_interactions
CREATE POLICY "Users can view interactions they initiated"
ON public.user_interactions FOR SELECT
USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create interactions"
ON public.user_interactions FOR INSERT
WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Admins can view all interactions"
ON public.user_interactions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_interests
CREATE POLICY "Users can view their own interests"
ON public.user_interests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interests"
ON public.user_interests FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for user_reports
CREATE POLICY "Users can view reports they created"
ON public.user_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
ON public.user_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.user_reports FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.user_reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_algorithm_audit_log_match_id ON public.algorithm_audit_log(match_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_audit_log_calculated_at ON public.algorithm_audit_log(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_feedback_match_id ON public.match_feedback(match_id);
CREATE INDEX IF NOT EXISTS idx_match_feedback_user_id ON public.match_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks(blocked_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_initiator_id ON public.user_interactions(initiator_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_recipient_id ON public.user_interactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_match_id ON public.user_interactions(match_id);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_id ON public.user_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
