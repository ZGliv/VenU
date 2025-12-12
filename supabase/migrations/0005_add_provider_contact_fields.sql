/**
 * 0005_add_provider_contact_fields.sql
 * 
 * Adds provider contact information fields to the venues table.
 * These fields allow providers to specify contact details specific to their venue,
 * which can differ from their user account information.
 * 
 * Fields:
 * - provider_name: Name of the provider/contact person for this venue
 * - provider_email: Email address for contacting the provider about this venue
 * - provider_phone: Phone number for contacting the provider about this venue
 */

-- Add provider contact fields to venues table
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS provider_email TEXT,
  ADD COLUMN IF NOT EXISTS provider_phone TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN public.venues.provider_name IS 'Name of the provider/contact person for this venue';
COMMENT ON COLUMN public.venues.provider_email IS 'Email address for contacting the provider about this venue';
COMMENT ON COLUMN public.venues.provider_phone IS 'Phone number for contacting the provider about this venue';
