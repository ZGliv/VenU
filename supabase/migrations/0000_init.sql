-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'venue_owner', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campus TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- calculated from start_time + service duration
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE, -- One review per booking
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users:
-- Public read (needed for profiles) - restrict if necessary, but generally needed for UI
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Venues:
-- Public read
CREATE POLICY "Venues are viewable by everyone" ON public.venues
  FOR SELECT USING (true);

-- Owners can insert/update/delete their own venues
CREATE POLICY "Owners can insert own venues" ON public.venues
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own venues" ON public.venues
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own venues" ON public.venues
  FOR DELETE USING (auth.uid() = owner_id);

-- Services:
-- Public read
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (true);

-- Owners can manage services via venue ownership
CREATE POLICY "Owners can insert services for their venues" ON public.services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE id = venue_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update services for their venues" ON public.services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE id = venue_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete services for their venues" ON public.services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE id = venue_id AND owner_id = auth.uid()
    )
  );

-- Bookings:
-- Users can see their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Venue owners can see bookings for their services
CREATE POLICY "Venue owners can view bookings for their services" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.services
      JOIN public.venues ON public.services.venue_id = public.venues.id
      WHERE public.services.id = service_id
        AND public.venues.owner_id = auth.uid()
    )
  );

-- Users can create bookings (for themselves)
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews:
-- Public read
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

-- Users can create reviews for their completed bookings
CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id AND user_id = auth.uid() AND status = 'completed'
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

