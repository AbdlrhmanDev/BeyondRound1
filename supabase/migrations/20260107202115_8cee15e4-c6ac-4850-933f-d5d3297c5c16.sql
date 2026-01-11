-- Add new profile fields from questionnaire
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS gender_preference text;

-- Expand onboarding_preferences with new detailed fields
ALTER TABLE public.onboarding_preferences
ADD COLUMN IF NOT EXISTS activity_level text,
ADD COLUMN IF NOT EXISTS music_preferences text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS movie_preferences text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS other_interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meeting_activities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_energy text,
ADD COLUMN IF NOT EXISTS conversation_style text,
ADD COLUMN IF NOT EXISTS dietary_preferences text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS life_stage text,
ADD COLUMN IF NOT EXISTS specialty_preference text,
ADD COLUMN IF NOT EXISTS ideal_weekend text[] DEFAULT '{}';