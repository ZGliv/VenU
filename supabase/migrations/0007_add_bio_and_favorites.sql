/**
 * 0007_add_bio_and_favorites.sql
 * 
 * Adds bio field to users table for provider profiles and creates a favorites
 * table to allow users to favorite venues.
 * 
 * Changes:
 * - Adds bio TEXT column to users table for storing detailed provider bios
 * - Creates favorites table for user-venue favorite relationships
 * - Adds appropriate RLS policies for favorites
 */

-- Add bio field to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.users.bio IS 'Detailed biography for providers including background, experience, and personal info';

-- Create favorites table for user-venue relationships
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure a user can only favorite a venue once
  UNIQUE(user_id, venue_id)
);

-- Enable Row Level Security on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

-- RLS Policies for favorites

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_venue_id ON public.favorites(venue_id);
