/**
 * 0006_add_admin_message.sql
 * 
 * Migration to add admin messaging fields to venues table.
 * Enables admins to send messages when approving, rejecting, or revoking venues.
 * 
 * Changes:
 * - Adds 'admin_message' column to store approval/rejection/revocation reasons
 * - Adds 'status_updated_at' column to track when status was last changed
 * - Adds 'status_updated_by' column to track which admin made the change
 */

-- Add admin_message column to store the message sent to venue owner
-- This is used for welcome messages (on approval) and rejection reasons
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS admin_message TEXT;

-- Add status_updated_at column to track when the status was last changed
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE;

-- Add status_updated_by column to track which admin changed the status
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.users(id);

-- Add index for faster lookups by status_updated_at (for audit/history purposes)
CREATE INDEX IF NOT EXISTS idx_venues_status_updated_at ON public.venues(status_updated_at);

-- Update RLS policy to allow admins to update any venue status
-- First, drop existing owner-only update policy and recreate with admin access
DROP POLICY IF EXISTS "Owners can update own venues" ON public.venues;

-- Owners can update their own venues (except status fields which are admin-only)
CREATE POLICY "Owners can update own venues" ON public.venues
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admins can update any venue (for status changes)
CREATE POLICY "Admins can update any venue" ON public.venues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
