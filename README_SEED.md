# Seed Script Instructions

## Prerequisites

1. **Get your Supabase Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the `service_role` key (NOT the anon key)
   - Add it to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Make sure you have the Supabase URL in `.env.local`:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
# OR
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

## Running the Seed Script

```bash
npm run seed
```

## What it does:

1. **Creates 50 test users** with:
   - Random specialties, career stages, interests
   - Random cities in Saudi Arabia
   - Random genders and birth years
   - Complete profiles and onboarding preferences

2. **Calculates matches** between all users using the `calculate_match_score` function
   - Only creates matches with score ≥ 30
   - Accepts top 20 matches (score ≥ 60)

3. **Creates groups** of 5 members each:
   - Mixed groups (2F3M or 3F2M)
   - Same-gender groups (all_female or all_male)
   - Groups are linked to the current match week (Thursday)

## Login Credentials

All test users can be logged in with:
- **Email:** `test_user_1@connectthrive.com` through `test_user_50@connectthrive.com`
- **Password:** `password123`

## Notes

- The script uses Supabase Admin API (service_role key) to bypass RLS
- It may take a few minutes to complete (calculating ~2450 match scores)
- Each run will create new users (you may want to clean up first)
