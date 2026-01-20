-- Verification and Fix Script for handle_new_user Trigger
-- Run this in Supabase SQL Editor to verify and fix the trigger function

-- Step 1: Check if the function exists and view its current definition
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✅ Function handle_new_user exists';
  ELSE
    RAISE WARNING '❌ Function handle_new_user does NOT exist - creating it now';
  END IF;
END $$;

-- Step 2: Check if the trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created exists';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created does NOT exist';
  END IF;
END $$;

-- Step 3: Check if status column exists and is NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'status'
  ) THEN
    RAISE NOTICE '✅ Status column exists in profiles table';
    
    -- Check if it's NOT NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'status'
      AND is_nullable = 'NO'
    ) THEN
      RAISE NOTICE '✅ Status column is NOT NULL (this is correct)';
    ELSE
      RAISE WARNING '⚠️ Status column allows NULL (may cause issues)';
    END IF;
  ELSE
    RAISE WARNING '❌ Status column does NOT exist in profiles table';
  END IF;
END $$;

-- Step 4: Apply the fix (same as the migration file)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Verify the trigger is attached
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE 'Creating trigger on_auth_user_created...';
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    RAISE NOTICE '✅ Trigger created successfully';
  ELSE
    RAISE NOTICE '✅ Trigger already exists';
  END IF;
END $$;

-- Step 6: Test query to check recent signups and profiles
SELECT 
  'Recent Users' as check_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'Recent Profiles' as check_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Step 7: Check for users without profiles (indicates trigger failure)
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  p.user_id as profile_exists
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '24 hours'
  AND p.user_id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
