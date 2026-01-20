# Troubleshooting Signup 500 Error

## Error: "Error sending confirmation email" (500)

This error typically occurs when:
1. The database trigger function fails during user creation
2. Email service is misconfigured in Supabase
3. Database constraints are violated

## Root Cause Analysis

The error message "Error sending confirmation email" with status 500 suggests that:
- The signup request reaches Supabase
- User creation might succeed, but the trigger function (`handle_new_user`) fails
- This causes the transaction to rollback, preventing email sending

## Solution Steps

### 1. Apply the Database Migration

The migration file `supabase/migrations/20260120160013_fix_handle_new_user_trigger.sql` fixes the trigger function to explicitly set the `status` field.

**Apply it using one of these methods:**

#### Option A: Using Supabase CLI (Recommended)
```bash
supabase db push
```

#### Option B: Manual Application
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20260120160013_fix_handle_new_user_trigger.sql`
4. Run the SQL script

#### Option C: Verification Script (Recommended First Step)
1. Go to your Supabase Dashboard → SQL Editor
2. Run the verification script: `supabase/migrations/20260120160014_verify_and_fix_trigger.sql`
3. This will check the current state and apply the fix if needed
4. Review the output messages to see what was fixed

### 2. Verify the Trigger Function

After applying the migration, verify the trigger function exists and is correct:

```sql
-- Check if the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### 3. Check Database Logs

In Supabase Dashboard:
1. Go to **Logs** → **Postgres Logs**
2. Look for errors related to `handle_new_user` or profile creation
3. Check for constraint violations or RLS policy issues

### 4. Verify Email Configuration

If the trigger is working but emails still fail:
1. Go to **Authentication** → **Email Templates**
2. Verify email templates are configured
3. Check **Settings** → **Auth** → **Email** for SMTP configuration
4. For development, you can disable email confirmation in **Authentication** → **Settings** → **Email Auth**

### 5. Test the Trigger Function Manually

You can test if the trigger works by checking if a profile is created:

```sql
-- Check recent profiles
SELECT user_id, full_name, status, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- If no profiles exist for recent users, the trigger is failing
```

## Common Issues

### Issue 1: Status Column Missing
**Symptom:** Trigger fails because `status` column is NOT NULL but not provided
**Solution:** The migration fixes this by explicitly setting `status = 'active'`

### Issue 2: RLS Policy Blocking Insert
**Symptom:** Trigger uses `SECURITY DEFINER` but still fails
**Solution:** The migration ensures `SECURITY DEFINER SET search_path = public` is set

### Issue 3: Email Service Not Configured
**Symptom:** User created but email fails
**Solution:** Configure SMTP in Supabase Dashboard or disable email confirmation for development

## Debugging Steps

1. **Check if user was created:**
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

2. **Check if profile was created:**
   ```sql
   SELECT user_id, full_name, status 
   FROM public.profiles 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. **Check trigger function logs:**
   - Look for `RAISE WARNING` messages in Postgres logs
   - The trigger function logs errors but doesn't fail user creation

4. **Test trigger manually:**
   ```sql
   -- This should not fail
   SELECT public.handle_new_user();
   ```

## Expected Behavior After Fix

After applying the migration:
- User signup should succeed
- Profile should be created automatically with `status = 'active'`
- Confirmation email should be sent (if email is configured)
- No 500 errors should occur

## Additional Notes

- The trigger function uses `ON CONFLICT DO NOTHING` to prevent duplicate profile creation
- The function has exception handling to prevent user creation from failing
- Even if profile creation fails, the user account will still be created (with a warning logged)
