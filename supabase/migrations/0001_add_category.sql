-- Add category column to venues table
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_venues_category ON public.venues(category);

