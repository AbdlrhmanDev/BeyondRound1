-- =============================================================================
-- Feedback Responses Table
-- Stores single-question answers submitted via email links (e.g. q=social_blocker).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  email       TEXT,                          -- from the ?from= param (may be null if not provided)
  question    TEXT        NOT NULL,          -- e.g. 'social_blocker'
  answer      TEXT        NOT NULL,          -- the option the user selected
  source      TEXT                           -- e.g. 'email_drip_2'
);

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages feedback responses" ON public.feedback_responses;
CREATE POLICY "Service role manages feedback responses"
  ON public.feedback_responses FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS feedback_responses_question_idx ON public.feedback_responses (question);
CREATE INDEX IF NOT EXISTS feedback_responses_email_idx    ON public.feedback_responses (email);
CREATE INDEX IF NOT EXISTS feedback_responses_created_idx  ON public.feedback_responses (created_at DESC);
