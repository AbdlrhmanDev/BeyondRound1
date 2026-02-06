-- BeyondRounds: Events, Bookings, Verification (Timeleft-style flow)
-- Events = meetup slots (Brunch, Coffee, Walk, Sports)
-- Bookings = user reservations (paid before confirmation)
-- Verification = doctor verification (license, ID, employment proof)

-- Meetup type enum
CREATE TYPE public.meetup_type AS ENUM ('brunch', 'coffee', 'walk', 'sports', 'dinner');

-- Verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('medical_license', 'approbation', 'hospital_id', 'employment_proof')),
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  status verification_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Events table (meetup slots: city, type, date_time, neighborhood)
-- neighborhood: TEXT for dynamic neighborhoods from OpenStreetMap (any city)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL DEFAULT 'Berlin',
  meetup_type meetup_type NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  neighborhood TEXT,
  max_participants INTEGER NOT NULL DEFAULT 4,
  min_participants INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings table (user_id, event_id, status, paid, payment_id)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  paid BOOLEAN NOT NULL DEFAULT false,
  payment_id TEXT,
  stripe_session_id TEXT,
  preferences JSONB DEFAULT '{}', -- budget, dietary, language
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Add event_id to match_groups (optional - groups can be event-based or legacy)
ALTER TABLE public.match_groups 
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Add is_bot to group_messages for BeyondRounds Assistant
ALTER TABLE public.group_messages 
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

-- Event feedback table (after meetup)
CREATE TABLE IF NOT EXISTS public.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.match_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, group_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_events_city_date ON public.events(city, date_time);
CREATE INDEX IF NOT EXISTS idx_events_meetup_type ON public.events(meetup_type);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_match_groups_event_id ON public.match_groups(event_id);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

-- RLS: verification_requests - user sees own, admin sees all
DROP POLICY IF EXISTS "Users can view own verification" ON public.verification_requests;
CREATE POLICY "Users can view own verification" ON public.verification_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own verification" ON public.verification_requests;
CREATE POLICY "Users can insert own verification" ON public.verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own verification (only when pending)" ON public.verification_requests;
CREATE POLICY "Users can update own verification (only when pending)" ON public.verification_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can view all verification" ON public.verification_requests;
CREATE POLICY "Admins can view all verification" ON public.verification_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update verification status" ON public.verification_requests;
CREATE POLICY "Admins can update verification status" ON public.verification_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: events - all authenticated users can read open events
DROP POLICY IF EXISTS "Anyone can view open events" ON public.events;
CREATE POLICY "Anyone can view open events" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: bookings - users see only their own
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS: event_feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON public.event_feedback;
CREATE POLICY "Users can view own feedback" ON public.event_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own feedback" ON public.event_feedback;
CREATE POLICY "Users can create own feedback" ON public.event_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.event_feedback;
CREATE POLICY "Admins can view all feedback" ON public.event_feedback
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add verification_status to profiles if not exists (denormalized for quick checks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verification_status') THEN
    ALTER TABLE public.profiles ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Trigger to sync verification_status from verification_requests to profiles
CREATE OR REPLACE FUNCTION public.sync_verification_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET verification_status = NEW.status 
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_verification_updated ON public.verification_requests;
CREATE TRIGGER on_verification_updated
  AFTER UPDATE OF status ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_verification_to_profile();

-- Also sync on insert
DROP TRIGGER IF EXISTS on_verification_inserted ON public.verification_requests;
CREATE TRIGGER on_verification_inserted
  AFTER INSERT ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_verification_to_profile();

-- Updated_at triggers
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
