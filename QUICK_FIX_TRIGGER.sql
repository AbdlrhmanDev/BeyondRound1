-- QUICK FIX: Run this in Supabase SQL Editor to fix the signup error
-- This will check and fix the handle_new_user trigger function

-- Step 1: Check current function definition
SELECT 
  'Current Function' as check_type,
  proname as name,
  prosrc as definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Step 2: Fix the function to explicitly set status field
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

-- Step 3: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify the fix
SELECT 
  '✅ Function Fixed' as status,
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%status%' AND prosrc LIKE '%active%' THEN '✅ Status field included'
    ELSE '❌ Status field missing'
  END as check_result
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 
  '✅ Trigger Created' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 5: Check for orphaned users (users without profiles)
SELECT 
  '⚠️ Orphaned Users' as check_type,
  COUNT(*) as count,
  'Users created in last 24h without profiles' as description
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '24 hours'
  AND p.user_id IS NULL;
