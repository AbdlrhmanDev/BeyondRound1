-- Create admin role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.feedback
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all onboarding preferences
CREATE POLICY "Admins can view all preferences"
ON public.onboarding_preferences
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all matches
CREATE POLICY "Admins can view all matches"
ON public.matches
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all match groups
CREATE POLICY "Admins can view all match groups"
ON public.match_groups
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all group members
CREATE POLICY "Admins can view all group members"
ON public.group_members
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));