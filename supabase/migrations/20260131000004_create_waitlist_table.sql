-- Create waitlist table for pre-launch signups
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  city TEXT,
  medical_specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON public.waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_city_idx ON public.waitlist(city);
CREATE INDEX IF NOT EXISTS waitlist_specialty_idx ON public.waitlist(medical_specialty);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;

-- Anyone can insert into waitlist (public access for pre-launch)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Only admins can view waitlist entries
CREATE POLICY "Admins can view waitlist"
ON public.waitlist FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_waitlist_updated_at
BEFORE UPDATE ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION update_waitlist_updated_at();

-- Function to get waitlist count (public)
CREATE OR REPLACE FUNCTION get_waitlist_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM waitlist;
$$;
