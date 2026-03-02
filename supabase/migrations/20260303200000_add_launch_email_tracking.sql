-- Add launch email tracking columns
-- L1 + L2 tracked on waitlist, L3 (verify nudge) tracked on profiles

ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS launch_l1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS launch_l2_sent_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verify_nudge_sent_at TIMESTAMPTZ;
