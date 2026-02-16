-- Migration: Replace birth_year (integer) with date_of_birth (date)
-- This allows storing full date of birth instead of just the year.

-- 1. Add new column
ALTER TABLE profiles ADD COLUMN date_of_birth DATE;

-- 2. Migrate existing data (birth_year → YYYY-01-01)
UPDATE profiles
SET date_of_birth = make_date(birth_year, 1, 1)
WHERE birth_year IS NOT NULL;

-- 3. Drop old column
ALTER TABLE profiles DROP COLUMN birth_year;

-- 4. Add CHECK constraint: must be at least 18 years old, or NULL
ALTER TABLE profiles
ADD CONSTRAINT chk_date_of_birth_minimum_age
CHECK (date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')::date);
