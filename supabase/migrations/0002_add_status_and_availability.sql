/**
 * 0002_add_status_and_availability.sql
 * 
 * Migration to add status columns and availability table for VenU MVP.
 * Enables admin approval workflow for venues and user suspension.
 * Adds provider availability scheduling for time-slot based bookings.
 * 
 * Changes:
 * - Adds 'status' column to venues table (pending/approved/rejected)
 * - Adds 'status' column to users table (active/suspended)
 * - Creates 'availability' table for provider schedules
 * - Adds RLS policies for availability table
 */

-- Add status column to venues for admin approval workflow
-- New venues start as 'pending' until approved by admin
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add status column to users for account suspension
-- Users start as 'active', admins can suspend accounts
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'suspended'));

-- Create availability table for provider schedules
-- Stores weekly availability windows for each venue
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_venue_day UNIQUE(venue_id, day_of_week)
);

-- Enable RLS on availability table
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for availability

-- Public read: Everyone can view availability to see when bookings are possible
CREATE POLICY "Availability is viewable by everyone" ON public.availability
  FOR SELECT USING (true);

-- Venue owners can insert availability for their venues
CREATE POLICY "Owners can insert availability for their venues" ON public.availability
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE id = venue_id AND owner_id = auth.uid()
    )
  );

-- Venue owners can update availability for their venues
CREATE POLICY "Owners can update availability for their venues" ON public.availability
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE id = venue_id AND owner_id = auth.uid()
    )
  );

-- Venue owners can delete availability for their venues
CREATE POLICY "Owners can delete availability for their venues" ON public.availability
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE id = venue_id AND owner_id = auth.uid()
    )
  );

-- Add index for faster availability lookups by venue
CREATE INDEX IF NOT EXISTS idx_availability_venue_id ON public.availability(venue_id);

-- Add index for faster venue lookups by status (for admin approval queue)
CREATE INDEX IF NOT EXISTS idx_venues_status ON public.venues(status);

-- Add index for faster user lookups by status (for admin user management)
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Update existing venues to be approved (so current data still shows)
UPDATE public.venues SET status = 'approved' WHERE status IS NULL;

-- Update existing users to be active
UPDATE public.users SET status = 'active' WHERE status IS NULL;

