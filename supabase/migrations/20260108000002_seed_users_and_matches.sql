-- Seed 50 users with profiles and preferences, then create matches and groups
-- This script creates test data for development

DO $$
DECLARE
  user_record RECORD;
  user_id_val UUID;
  profile_id_val UUID;
  pref_id_val UUID;
  specialty_list TEXT[] := ARRAY['Internal Medicine', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology', 'Psychiatry', 'Emergency Medicine', 'Anesthesiology', 'Radiology', 'Dermatology', 'Orthopedics', 'Ophthalmology', 'Gynecology', 'General Practice'];
  career_stage_list TEXT[] := ARRAY['medical_student', 'resident_junior', 'resident_senior', 'fellow', 'attending_early', 'attending_senior', 'private_practice', 'academic'];
  sports_list TEXT[] := ARRAY['running', 'cycling', 'swimming', 'gym', 'tennis', 'football', 'basketball', 'hiking', 'yoga', 'golf'];
  social_style_list TEXT[] := ARRAY['introverted', 'extroverted', 'ambivert', 'social_butterfly', 'selective'];
  culture_interests_list TEXT[] := ARRAY['art', 'music', 'theater', 'museums', 'literature', 'cinema', 'photography'];
  lifestyle_list TEXT[] := ARRAY['minimalist', 'active', 'balanced', 'work_focused', 'family_oriented'];
  city_list TEXT[] := ARRAY['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Abha', 'Tabuk'];
  gender_list TEXT[] := ARRAY['male', 'female'];
  i INTEGER;
  random_specialty TEXT;
  random_stage TEXT;
  random_sports TEXT[];
  random_social TEXT[];
  random_culture TEXT[];
  random_lifestyle TEXT[];
  random_city TEXT;
  random_gender TEXT;
  random_birth_year INTEGER;
  match_score_val NUMERIC;
  match_pair RECORD;
  group_id_val UUID;
  member_count INTEGER;
  current_week DATE;
BEGIN
  -- Get current Thursday (match week)
  current_week := DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '4 days';
  IF EXTRACT(DOW FROM CURRENT_DATE) < 4 THEN
    current_week := current_week - INTERVAL '7 days';
  END IF;

  -- Create 50 users
  FOR i IN 1..50 LOOP
    -- Generate random data
    random_specialty := specialty_list[1 + floor(random() * array_length(specialty_list, 1))::int];
    random_stage := career_stage_list[1 + floor(random() * array_length(career_stage_list, 1))::int];
    random_gender := gender_list[1 + floor(random() * array_length(gender_list, 1))::int];
    random_city := city_list[1 + floor(random() * array_length(city_list, 1))::int];
    random_birth_year := 1970 + floor(random() * 30)::int; -- Ages 30-60
    
    -- Random arrays (2-4 items each)
    random_sports := ARRAY(
      SELECT sports_list[1 + floor(random() * array_length(sports_list, 1))::int]
      FROM generate_series(1, 2 + floor(random() * 3)::int)
    );
    random_social := ARRAY(
      SELECT social_style_list[1 + floor(random() * array_length(social_style_list, 1))::int]
      FROM generate_series(1, 1 + floor(random() * 2)::int)
    );
    random_culture := ARRAY(
      SELECT culture_interests_list[1 + floor(random() * array_length(culture_interests_list, 1))::int]
      FROM generate_series(1, 2 + floor(random() * 3)::int)
    );
    random_lifestyle := ARRAY(
      SELECT lifestyle_list[1 + floor(random() * array_length(lifestyle_list, 1))::int]
      FROM generate_series(1, 1 + floor(random() * 2)::int)
    );

    -- Create auth user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'test_user_' || i || '@connectthrive.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'Dr. Test User ' || i),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO user_id_val;

    -- Create profile
    INSERT INTO public.profiles (
      user_id,
      full_name,
      city,
      gender,
      birth_year,
      languages,
      status
    ) VALUES (
      user_id_val,
      'Dr. Test User ' || i,
      random_city,
      random_gender,
      random_birth_year,
      ARRAY['Arabic', 'English'],
      'active'
    ) RETURNING id INTO profile_id_val;

    -- Create onboarding preferences
    INSERT INTO public.onboarding_preferences (
      user_id,
      specialty,
      career_stage,
      sports,
      social_style,
      culture_interests,
      lifestyle,
      goals,
      availability_slots,
      completed_at
    ) VALUES (
      user_id_val,
      random_specialty,
      random_stage,
      random_sports,
      random_social,
      random_culture,
      random_lifestyle,
      ARRAY['networking', 'friendship'],
      ARRAY['weekend_morning', 'weekend_evening', 'weekday_evening'],
      NOW()
    ) RETURNING id INTO pref_id_val;

    RAISE NOTICE 'Created user %: %', i, user_id_val;
  END LOOP;

  RAISE NOTICE 'Finished creating 50 users. Now calculating matches...';

  -- Calculate matches between all users using the algorithm
  FOR user_record IN 
    SELECT user_id FROM public.profiles WHERE status = 'active'
  LOOP
    FOR match_pair IN
      SELECT p2.user_id as matched_user_id
      FROM public.profiles p2
      WHERE p2.user_id != user_record.user_id
        AND p2.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM public.matches m
          WHERE (m.user_id = user_record.user_id AND m.matched_user_id = p2.user_id)
             OR (m.user_id = p2.user_id AND m.matched_user_id = user_record.user_id)
        )
    LOOP
      -- Calculate match score using the function
      SELECT calculate_match_score(user_record.user_id, match_pair.matched_user_id) INTO match_score_val;
      
      -- Only create match if score is above threshold (e.g., 30)
      IF match_score_val >= 30 THEN
        INSERT INTO public.matches (
          user_id,
          matched_user_id,
          match_score,
          status
        ) VALUES (
          user_record.user_id,
          match_pair.matched_user_id,
          match_score_val,
          'pending'
        ) ON CONFLICT (user_id, matched_user_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Finished creating matches. Now creating groups...';

  -- Create groups (5 members each, mixed and same-gender)
  DECLARE
    group_type_val TEXT;
    gender_comp_val TEXT;
    existing_mixed_count INTEGER;
    existing_same_count INTEGER;
    current_group_id UUID;
    users_added INTEGER := 0;
  BEGIN
    -- Process users in random order
    FOR user_record IN
      SELECT 
        p.user_id,
        p.gender,
        op.specialty
      FROM public.profiles p
      JOIN public.onboarding_preferences op ON op.user_id = p.user_id
      WHERE p.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.user_id = p.user_id
        )
      ORDER BY RANDOM()
      LIMIT 50
    LOOP
      current_group_id := NULL;
      
      -- Try to find existing group with space that matches user's gender
      IF user_record.gender = 'female' THEN
        -- Try same-gender female group first
        SELECT gm.group_id INTO current_group_id
        FROM public.group_members gm
        JOIN public.match_groups mg ON mg.id = gm.group_id
        WHERE mg.status = 'active'
          AND mg.match_week = current_week
          AND mg.group_type = 'same_gender'
          AND mg.gender_composition = 'all_female'
        GROUP BY gm.group_id
        HAVING COUNT(*) < 5
        ORDER BY COUNT(*) ASC
        LIMIT 1;
        
        -- If not found, try mixed group
        IF current_group_id IS NULL THEN
          SELECT gm.group_id INTO current_group_id
          FROM public.group_members gm
          JOIN public.match_groups mg ON mg.id = gm.group_id
          WHERE mg.status = 'active'
            AND mg.match_week = current_week
            AND mg.group_type = 'mixed'
          GROUP BY gm.group_id
          HAVING COUNT(*) < 5
          ORDER BY COUNT(*) ASC
          LIMIT 1;
        END IF;
      ELSE
        -- Try same-gender male group first
        SELECT gm.group_id INTO current_group_id
        FROM public.group_members gm
        JOIN public.match_groups mg ON mg.id = gm.group_id
        WHERE mg.status = 'active'
          AND mg.match_week = current_week
          AND mg.group_type = 'same_gender'
          AND mg.gender_composition = 'all_male'
        GROUP BY gm.group_id
        HAVING COUNT(*) < 5
        ORDER BY COUNT(*) ASC
        LIMIT 1;
        
        -- If not found, try mixed group
        IF current_group_id IS NULL THEN
          SELECT gm.group_id INTO current_group_id
          FROM public.group_members gm
          JOIN public.match_groups mg ON mg.id = gm.group_id
          WHERE mg.status = 'active'
            AND mg.match_week = current_week
            AND mg.group_type = 'mixed'
          GROUP BY gm.group_id
          HAVING COUNT(*) < 5
          ORDER BY COUNT(*) ASC
          LIMIT 1;
        END IF;
      END IF;

      -- If no suitable group found, create new one
      IF current_group_id IS NULL THEN
        SELECT COUNT(*) INTO existing_mixed_count
        FROM public.match_groups
        WHERE match_week = current_week AND group_type = 'mixed';
        
        SELECT COUNT(*) INTO existing_same_count
        FROM public.match_groups
        WHERE match_week = current_week AND group_type = 'same_gender';

        -- Alternate between mixed and same-gender
        IF existing_same_count <= existing_mixed_count THEN
          group_type_val := 'same_gender';
          gender_comp_val := CASE 
            WHEN user_record.gender = 'female' THEN 'all_female'
            ELSE 'all_male'
          END;
        ELSE
          group_type_val := 'mixed';
          gender_comp_val := CASE 
            WHEN random() < 0.5 THEN '2F3M'
            ELSE '3F2M'
          END;
        END IF;

        INSERT INTO public.match_groups (
          name,
          group_type,
          gender_composition,
          status,
          match_week
        ) VALUES (
          'Group ' || (COALESCE(existing_mixed_count, 0) + COALESCE(existing_same_count, 0) + 1),
          group_type_val,
          gender_comp_val,
          'active',
          current_week
        ) RETURNING id INTO current_group_id;
      END IF;

      -- Add user to group
      IF current_group_id IS NOT NULL THEN
        INSERT INTO public.group_members (
          group_id,
          user_id
        ) VALUES (
          current_group_id,
          user_record.user_id
        ) ON CONFLICT (group_id, user_id) DO NOTHING;
        
        users_added := users_added + 1;
      END IF;
    END LOOP;
  END;

  RAISE NOTICE 'Finished creating groups. Seeding complete!';

  -- Create some accepted matches for testing
  UPDATE public.matches
  SET status = 'accepted'
  WHERE id IN (
    SELECT id FROM public.matches
    WHERE match_score >= 60
    ORDER BY match_score DESC
    LIMIT 20
  );

  RAISE NOTICE 'Seeding complete: 50 users created, matches calculated, and groups formed!';
END $$;
