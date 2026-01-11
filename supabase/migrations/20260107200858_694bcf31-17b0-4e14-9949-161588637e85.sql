-- Add expanded profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birth_year integer;

-- Expand onboarding_preferences with granular interest categories and availability
ALTER TABLE public.onboarding_preferences
ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sports text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_style text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS culture_interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lifestyle text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personality_traits jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_slots text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_meet_duration text,
ADD COLUMN IF NOT EXISTS open_to_business boolean DEFAULT false;

-- Create specialty relationships table for scoring related specialties
CREATE TABLE IF NOT EXISTS public.specialty_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_1 text NOT NULL,
  specialty_2 text NOT NULL,
  relationship_score numeric DEFAULT 0.5,
  UNIQUE(specialty_1, specialty_2)
);

-- Insert common specialty relationships (score 0.7 = related, 0.5 = neutral)
INSERT INTO public.specialty_relationships (specialty_1, specialty_2, relationship_score) VALUES
  ('Internal Medicine', 'Cardiology', 0.8),
  ('Internal Medicine', 'Pulmonology', 0.8),
  ('Internal Medicine', 'Gastroenterology', 0.8),
  ('Internal Medicine', 'Nephrology', 0.8),
  ('Internal Medicine', 'Endocrinology', 0.8),
  ('Surgery', 'Orthopedics', 0.7),
  ('Surgery', 'Plastic Surgery', 0.7),
  ('Surgery', 'Neurosurgery', 0.7),
  ('Surgery', 'Cardiothoracic Surgery', 0.8),
  ('Pediatrics', 'Neonatology', 0.9),
  ('Pediatrics', 'Pediatric Surgery', 0.8),
  ('OB/GYN', 'Maternal-Fetal Medicine', 0.9),
  ('Psychiatry', 'Neurology', 0.6),
  ('Radiology', 'Nuclear Medicine', 0.7),
  ('Emergency Medicine', 'Critical Care', 0.7),
  ('Anesthesiology', 'Critical Care', 0.7),
  ('Dermatology', 'Plastic Surgery', 0.5),
  ('Ophthalmology', 'Neurology', 0.4),
  ('Family Medicine', 'Internal Medicine', 0.6),
  ('Family Medicine', 'Pediatrics', 0.6)
ON CONFLICT (specialty_1, specialty_2) DO NOTHING;

-- Enable RLS on specialty_relationships (public read)
ALTER TABLE public.specialty_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view specialty relationships"
ON public.specialty_relationships
FOR SELECT
USING (true);

-- Create function to calculate match score between two users
CREATE OR REPLACE FUNCTION public.calculate_match_score(user_a_id uuid, user_b_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pref_a record;
  pref_b record;
  prof_a record;
  prof_b record;
  interest_score numeric := 0;
  specialty_score numeric := 0;
  location_score numeric := 0;
  availability_score numeric := 0;
  total_score numeric := 0;
  shared_interests integer := 0;
  total_interests integer := 0;
  shared_sports integer := 0;
  shared_social integer := 0;
  shared_culture integer := 0;
  shared_lifestyle integer := 0;
  shared_availability integer := 0;
  specialty_rel numeric;
BEGIN
  -- Get preferences for both users
  SELECT * INTO pref_a FROM onboarding_preferences WHERE user_id = user_a_id;
  SELECT * INTO pref_b FROM onboarding_preferences WHERE user_id = user_b_id;
  
  -- Get profiles for both users
  SELECT * INTO prof_a FROM profiles WHERE user_id = user_a_id;
  SELECT * INTO prof_b FROM profiles WHERE user_id = user_b_id;
  
  -- Return 0 if either user doesn't have preferences
  IF pref_a IS NULL OR pref_b IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. INTERESTS SCORE (40%)
  -- Calculate shared interests across all categories
  IF pref_a.sports IS NOT NULL AND pref_b.sports IS NOT NULL THEN
    SELECT COUNT(*) INTO shared_sports 
    FROM unnest(pref_a.sports) a 
    JOIN unnest(pref_b.sports) b ON a = b;
    total_interests := total_interests + GREATEST(array_length(pref_a.sports, 1), 1) + GREATEST(array_length(pref_b.sports, 1), 1);
    shared_interests := shared_interests + shared_sports * 2; -- Double count for overlap
  END IF;
  
  IF pref_a.social_style IS NOT NULL AND pref_b.social_style IS NOT NULL THEN
    SELECT COUNT(*) INTO shared_social 
    FROM unnest(pref_a.social_style) a 
    JOIN unnest(pref_b.social_style) b ON a = b;
    total_interests := total_interests + GREATEST(array_length(pref_a.social_style, 1), 1) + GREATEST(array_length(pref_b.social_style, 1), 1);
    shared_interests := shared_interests + shared_social * 2;
  END IF;
  
  IF pref_a.culture_interests IS NOT NULL AND pref_b.culture_interests IS NOT NULL THEN
    SELECT COUNT(*) INTO shared_culture 
    FROM unnest(pref_a.culture_interests) a 
    JOIN unnest(pref_b.culture_interests) b ON a = b;
    total_interests := total_interests + GREATEST(array_length(pref_a.culture_interests, 1), 1) + GREATEST(array_length(pref_b.culture_interests, 1), 1);
    shared_interests := shared_interests + shared_culture * 2;
  END IF;
  
  IF pref_a.lifestyle IS NOT NULL AND pref_b.lifestyle IS NOT NULL THEN
    SELECT COUNT(*) INTO shared_lifestyle 
    FROM unnest(pref_a.lifestyle) a 
    JOIN unnest(pref_b.lifestyle) b ON a = b;
    total_interests := total_interests + GREATEST(array_length(pref_a.lifestyle, 1), 1) + GREATEST(array_length(pref_b.lifestyle, 1), 1);
    shared_interests := shared_interests + shared_lifestyle * 2;
  END IF;
  
  -- Jaccard-style similarity
  IF total_interests > 0 THEN
    interest_score := (shared_interests::numeric / total_interests) * 40;
  END IF;
  
  -- Bonus for business interest match
  IF pref_a.open_to_business = true AND pref_b.open_to_business = true THEN
    interest_score := interest_score + 5;
  END IF;
  
  -- 2. SPECIALTY SCORE (30%)
  IF pref_a.specialty IS NOT NULL AND pref_b.specialty IS NOT NULL THEN
    IF pref_a.specialty = pref_b.specialty THEN
      specialty_score := 30; -- Same specialty = full points
    ELSE
      -- Check relationship table
      SELECT relationship_score INTO specialty_rel 
      FROM specialty_relationships 
      WHERE (specialty_1 = pref_a.specialty AND specialty_2 = pref_b.specialty)
         OR (specialty_1 = pref_b.specialty AND specialty_2 = pref_a.specialty)
      LIMIT 1;
      
      IF specialty_rel IS NOT NULL THEN
        specialty_score := specialty_rel * 30;
      ELSE
        specialty_score := 10; -- Different unrelated specialty = base points
      END IF;
    END IF;
  END IF;
  
  -- 3. LOCATION SCORE (20%)
  IF prof_a.city IS NOT NULL AND prof_b.city IS NOT NULL THEN
    IF LOWER(prof_a.city) = LOWER(prof_b.city) THEN
      location_score := 15; -- Same city
      
      -- Same neighborhood bonus
      IF prof_a.neighborhood IS NOT NULL AND prof_b.neighborhood IS NOT NULL 
         AND LOWER(prof_a.neighborhood) = LOWER(prof_b.neighborhood) THEN
        location_score := 20;
      END IF;
    END IF;
  END IF;
  
  -- 4. AVAILABILITY SCORE (10%)
  IF pref_a.availability_slots IS NOT NULL AND pref_b.availability_slots IS NOT NULL THEN
    SELECT COUNT(*) INTO shared_availability 
    FROM unnest(pref_a.availability_slots) a 
    JOIN unnest(pref_b.availability_slots) b ON a = b;
    
    IF shared_availability > 0 THEN
      availability_score := LEAST(shared_availability * 3, 10);
    END IF;
  END IF;
  
  -- Calculate total score (cap at 100)
  total_score := LEAST(interest_score + specialty_score + location_score + availability_score, 100);
  
  RETURN ROUND(total_score, 1);
END;
$$;