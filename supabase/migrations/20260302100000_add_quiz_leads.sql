-- =============================================================================
-- Quiz Leads Table
-- Stores Social Health Score quiz submissions for lead qualification.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_leads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contact info (Page 1)
  first_name        TEXT,
  email             TEXT        NOT NULL,
  phone             TEXT,
  location          TEXT,

  -- Social Health Score (Q1-10, yes/no)
  score             INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),

  -- Qualifying answers (Q11-15)
  q11_situation     TEXT,   -- how long in Berlin
  q12_goal          TEXT,   -- desired outcome in 90 days
  q13_obstacle      TEXT,   -- main blocker
  q14_budget        TEXT,   -- solution/price preference (KEY QUALIFIER)
  q15_additional    TEXT,   -- open text (optional)

  -- Full answer snapshot (for analytics)
  all_answers       JSONB   NOT NULL DEFAULT '{}'
);

-- Row Level Security: quiz leads are internal marketing data, service_role only
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages quiz leads" ON public.quiz_leads;
CREATE POLICY "Service role manages quiz leads"
  ON public.quiz_leads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS quiz_leads_email_idx      ON public.quiz_leads (email);
CREATE INDEX IF NOT EXISTS quiz_leads_created_at_idx ON public.quiz_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_leads_score_idx      ON public.quiz_leads (score);
CREATE INDEX IF NOT EXISTS quiz_leads_budget_idx     ON public.quiz_leads (q14_budget);
