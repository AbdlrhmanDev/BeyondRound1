# Step-by-Step Fix for Signup 500 Error

## The Problem
The database trigger `handle_new_user()` is failing because it doesn't set the `status` field when creating profiles. Since `status` is `NOT NULL`, the insert fails and rolls back the entire signup.

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `peqluzhrhgnwjhvxxtzs`

### Step 2: Open SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New query** button (top right)

### Step 3: Copy and Run the Fix
1. Open the file `QUICK_FIX_TRIGGER.sql` in your project
2. **Copy ALL the contents** (Ctrl+A, then Ctrl+C)
3. **Paste into the SQL Editor** (Ctrl+V)
4. Click **Run** button (or press Ctrl+Enter)

### Step 4: Verify the Results
After running, you should see:
- ✅ A query result showing "Current Function" 
- ✅ A success message: "CREATE FUNCTION"
- ✅ A success message: "CREATE TRIGGER"
- ✅ Verification queries showing "Status field included" and "Trigger Created"

### Step 5: Test Signup
1. Go back to your app (http://localhost:8080)
2. Try signing up again
3. The error should be gone!

---

## If You See Errors When Running the SQL

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Or use a service role key (Settings → API → service_role key)

### Error: "relation does not exist"
- The profiles table might not exist
- Check if you've run all migrations

### Error: "trigger already exists"
- This is OK! The script uses `DROP TRIGGER IF EXISTS` to handle this
- The function will still be updated

---

## Verify the Fix Worked

Run this query in SQL Editor to check:

```sql
-- Check if function includes status field
SELECT 
  proname,
  CASE 
    WHEN prosrc LIKE '%status%' AND prosrc LIKE '%active%' 
    THEN '✅ Fixed' 
    ELSE '❌ Needs Fix' 
  END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

You should see: `✅ Fixed`

---

## Still Having Issues?

1. **Check Postgres Logs:**
   - Dashboard → Logs → Postgres Logs
   - Look for errors containing "handle_new_user"

2. **Check if trigger exists:**
   ```sql
   SELECT tgname, tgrelid::regclass 
   FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created';
   ```

3. **Check for RLS issues:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename = 'profiles' AND policyname LIKE '%insert%';
   ```

4. **Test the function manually:**
   - This is tricky since it's a trigger, but you can check the function definition

---

## What the Fix Does

The updated trigger function:
1. ✅ Explicitly sets `status = 'active'` when creating profiles
2. ✅ Uses `SECURITY DEFINER` to bypass RLS policies
3. ✅ Has error handling to prevent user creation failures
4. ✅ Uses `ON CONFLICT DO NOTHING` to prevent duplicates

This ensures profiles are created correctly even if there are issues with default values.
