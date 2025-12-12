/**
 * 0003_add_missing_policies.sql
 * 
 * Adds missing RLS policies for full application functionality.
 * 
 * Users table:
 * - INSERT: Allows users to create their own profile
 * - UPDATE: Allows users to update their own profile including role
 * 
 * Bookings table:
 * - UPDATE: Allows users to update their own bookings (cancel)
 * - UPDATE: Allows venue owners to update bookings for their services (confirm/complete)
 */

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Allow users to insert their own profile (needed for client-side profile creation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'users'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Drop the existing update policy to recreate with more permissions
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Allow users to update their own profile including role changes
-- This is needed for the dev panel role switching and becoming a provider
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

-- Allow users to update their own bookings (e.g., cancel)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own bookings' AND tablename = 'bookings'
  ) THEN
    CREATE POLICY "Users can update own bookings" ON public.bookings
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow venue owners to update bookings for their services (confirm, complete, etc.)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Venue owners can update bookings for their services' AND tablename = 'bookings'
  ) THEN
    CREATE POLICY "Venue owners can update bookings for their services" ON public.bookings
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.services
          JOIN public.venues ON public.services.venue_id = public.venues.id
          WHERE public.services.id = service_id
            AND public.venues.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

