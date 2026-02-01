-- Survey submissions for the "second funnel" (quiz/survey)
CREATE TABLE IF NOT EXISTS public.survey_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS survey_submissions_email_idx ON public.survey_submissions(email);
CREATE INDEX IF NOT EXISTS survey_submissions_created_at_idx ON public.survey_submissions(created_at DESC);

ALTER TABLE public.survey_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (anon + authenticated)
CREATE POLICY "Anyone can submit survey"
ON public.survey_submissions FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Only admins can read (optional: for analytics)
CREATE POLICY "Admins can view survey submissions"
ON public.survey_submissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
