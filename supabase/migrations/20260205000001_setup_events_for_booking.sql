-- ============================================
-- Setup Events for Booking System
-- ============================================
-- This migration ensures the meetup_type enum exists
-- Events are now created via API: POST /api/events/seed
-- Run this migration first, then call the API endpoint to generate events

-- First, ensure the meetup_type enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meetup_type') THEN
    CREATE TYPE public.meetup_type AS ENUM ('brunch', 'coffee', 'walk', 'sports', 'dinner');
  END IF;
END $$;

-- Note: Events are now created via the API endpoint /api/events/seed
-- Call POST /api/events/seed with body: { "city": "Berlin", "weeksAhead": 4 }
-- This allows dynamic event generation without hardcoding dates in SQL
