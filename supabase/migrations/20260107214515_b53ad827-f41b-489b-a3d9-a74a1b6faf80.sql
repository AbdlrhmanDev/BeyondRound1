-- Add status column to profiles for ban/suspend
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Add banned_at and banned_reason columns
ALTER TABLE public.profiles 
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ban_reason TEXT;

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));