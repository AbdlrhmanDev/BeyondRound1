-- Add group language preference column for matching
-- Values: 'arabic', 'english', 'both'
ALTER TABLE public.onboarding_preferences
ADD COLUMN IF NOT EXISTS group_language_preference text;
