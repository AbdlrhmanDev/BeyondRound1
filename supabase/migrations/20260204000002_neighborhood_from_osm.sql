-- Change neighborhood from enum to TEXT to support dynamic neighborhoods from any city (OpenStreetMap)
-- Run this AFTER 20260204000000_create_events_bookings_verification.sql

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'neighborhood') THEN
    ALTER TABLE public.events ALTER COLUMN neighborhood TYPE TEXT USING neighborhood::text;
  END IF;
END $$;

DROP TYPE IF EXISTS public.neighborhood;
