-- Booking correctness belongs in PostgreSQL: clients cannot reserve occupied time,
-- forge prices, promote themselves, or approve their own listing.
-- This migration intentionally fails on invalid historical rows/overlaps so an
-- operator can resolve those records without silently deleting customer data.
BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
ALTER EXTENSION btree_gist SET SCHEMA extensions;
SET LOCAL search_path = public, extensions;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND status = 'active');
$$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

CREATE FUNCTION private.is_active_account(account_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.users WHERE id = account_id AND status = 'active'
  );
$$;
REVOKE ALL ON FUNCTION private.is_active_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_active_account(uuid) TO authenticated;

ALTER TABLE public.bookings ADD COLUMN provider_id uuid REFERENCES public.users(id);
UPDATE public.bookings b SET provider_id = v.owner_id FROM public.services s JOIN public.venues v ON v.id = s.venue_id WHERE b.service_id = s.id;
ALTER TABLE public.bookings ALTER COLUMN provider_id SET NOT NULL;

ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.venues ALTER COLUMN status SET NOT NULL;

-- The auth trigger is the only public-profile creator. Never derive authorization
-- from editable user metadata or a NEXT_PUBLIC email allowlist.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role, status)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', 'student', 'active');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON public.users FROM anon, authenticated;
REVOKE ALL ON public.users FROM anon;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Profiles visible to self and participating provider" ON public.users
FOR SELECT TO authenticated USING (
  id = (SELECT auth.uid()) OR (SELECT private.is_admin()) OR EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.user_id = users.id AND b.provider_id = (SELECT auth.uid())
  )
);
CREATE POLICY "Admins can manage account status" ON public.users
FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

CREATE FUNCTION private.guard_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = current_user AND rolsuper) THEN RETURN NEW; END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Account identity cannot be changed here.' USING ERRCODE = '42501';
  END IF;
  IF NOT private.is_admin() THEN
    IF OLD.id <> auth.uid() OR OLD.status <> 'active' OR NEW.status IS DISTINCT FROM OLD.status
       OR (NEW.role IS DISTINCT FROM OLD.role AND NOT (OLD.role = 'student' AND NEW.role = 'venue_owner')) THEN
      RAISE EXCEPTION 'You cannot change this account role or status.' USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_profile BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION private.guard_profile();

ALTER TABLE public.venues ADD COLUMN timezone text;
COMMENT ON COLUMN public.venues.timezone IS 'IANA timezone explicitly confirmed by provider. NULL means schedule setup is incomplete.';
CREATE FUNCTION private.guard_venue() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.timezone IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'Choose a valid IANA timezone.' USING ERRCODE = '22023';
  END IF;
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = current_user AND rolsuper) THEN RETURN NEW; END IF;
  IF NOT private.is_active_account(auth.uid()) THEN RAISE EXCEPTION 'An active account is required.' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id) THEN
    RAISE EXCEPTION 'Listing ownership cannot be changed here.' USING ERRCODE = '42501';
  END IF;
  IF NOT private.is_admin() THEN
    IF NEW.owner_id <> auth.uid() OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'venue_owner') THEN
      RAISE EXCEPTION 'A provider account is required.' USING ERRCODE = '42501';
    END IF;
    IF (TG_OP = 'INSERT' AND (NEW.status IS DISTINCT FROM 'pending' OR NEW.admin_message IS NOT NULL OR NEW.status_updated_by IS NOT NULL OR NEW.status_updated_at IS NOT NULL)) OR
       (TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.admin_message IS DISTINCT FROM OLD.admin_message OR NEW.status_updated_by IS DISTINCT FROM OLD.status_updated_by OR NEW.status_updated_at IS DISTINCT FROM OLD.status_updated_at)) THEN
      RAISE EXCEPTION 'Only an administrator can approve or reject a listing.' USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_venue() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_venue BEFORE INSERT OR UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION private.guard_venue();

ALTER TABLE public.services ADD CONSTRAINT service_duration_valid CHECK (duration BETWEEN 5 AND 720);
ALTER TABLE public.bookings ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.bookings ADD CONSTRAINT booking_positive_interval CHECK (end_time > start_time);
ALTER TABLE public.bookings ADD CONSTRAINT provider_cannot_overlap EXCLUDE USING gist (
  provider_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status IN ('pending', 'confirmed'));
CREATE INDEX bookings_user_start_idx ON public.bookings(user_id, start_time);
CREATE INDEX bookings_service_idx ON public.bookings(service_id);
CREATE POLICY "Admins can inspect bookings" ON public.bookings FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
DROP POLICY "Venue owners can view bookings for their services" ON public.bookings;
CREATE POLICY "Providers can view assigned bookings" ON public.bookings FOR SELECT TO authenticated USING (provider_id = (SELECT auth.uid()));
DROP POLICY "Venue owners can update bookings for their services" ON public.bookings;
CREATE POLICY "Providers can update assigned bookings" ON public.bookings FOR UPDATE TO authenticated USING (provider_id = (SELECT auth.uid())) WITH CHECK (provider_id = (SELECT auth.uid()));
DROP POLICY "Venues are viewable by everyone" ON public.venues;
CREATE POLICY "Approved listings and own drafts are visible" ON public.venues FOR SELECT USING (status = 'approved' OR owner_id = (SELECT auth.uid()));
DROP POLICY "Admins can update any venue" ON public.venues;
CREATE POLICY "Admins can update any venue" ON public.venues FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admins can review listings" ON public.venues FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
DROP POLICY "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services follow listing visibility" ON public.services FOR SELECT USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id));
DROP POLICY "Availability is viewable by everyone" ON public.availability;
CREATE POLICY "Availability follows listing visibility" ON public.availability FOR SELECT USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id));


-- Only this private helper can inspect other customers' occupied times. Its
-- authenticated public wrapper returns slots, never customer/booking identifiers.
CREATE FUNCTION private.booking_slots(service uuid, booking_day date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz, available boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE listing record; hours record; start_at timestamptz; end_at timestamptz; finish_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'active') THEN
    RAISE EXCEPTION 'Sign in with an active account to see appointment times.' USING ERRCODE = '42501';
  END IF;
  SELECT s.duration, v.id, v.owner_id, v.timezone INTO listing FROM public.services s JOIN public.venues v ON v.id = s.venue_id JOIN public.users u ON u.id = v.owner_id
  WHERE s.id = service AND v.status = 'approved' AND u.status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'This service is not accepting bookings.' USING ERRCODE = '22023'; END IF;
  IF listing.timezone IS NULL THEN RAISE EXCEPTION 'The provider needs to finish setting their schedule and timezone.' USING ERRCODE = '22023'; END IF;
  IF booking_day < (now() AT TIME ZONE listing.timezone)::date OR booking_day > (now() AT TIME ZONE listing.timezone)::date + 30 THEN
    RAISE EXCEPTION 'Choose a date within the next 30 days.' USING ERRCODE = '22023';
  END IF;
  SELECT a.start_time, a.end_time INTO hours FROM public.availability a WHERE a.venue_id = listing.id AND a.day_of_week = extract(dow FROM booking_day);
  IF NOT FOUND THEN RETURN; END IF;
  start_at := (booking_day + hours.start_time) AT TIME ZONE listing.timezone;
  finish_at := (booking_day + hours.end_time) AT TIME ZONE listing.timezone;
  WHILE start_at + make_interval(mins => listing.duration) <= finish_at LOOP
    end_at := start_at + make_interval(mins => listing.duration);
    -- UTC stepping produces real, unambiguous instants through DST transitions.
    RETURN QUERY SELECT start_at, end_at, start_at > now() AND NOT EXISTS (
      SELECT 1 FROM public.bookings b WHERE b.provider_id = listing.owner_id AND b.status IN ('pending', 'confirmed')
      AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(start_at, end_at, '[)')
    );
    start_at := start_at + interval '30 minutes';
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION private.booking_slots(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.booking_slots(uuid, date) TO authenticated;
CREATE FUNCTION public.list_booking_slots(service uuid, booking_day date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz, available boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$ SELECT * FROM private.booking_slots(service, booking_day); $$;
REVOKE ALL ON FUNCTION public.list_booking_slots(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_booking_slots(uuid, date) TO authenticated;

CREATE FUNCTION private.guard_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE chosen_service public.services; listing public.venues;
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = current_user AND rolsuper) THEN RETURN NEW; END IF;
  IF NOT private.is_active_account(auth.uid()) THEN RAISE EXCEPTION 'An active account is required.' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id <> auth.uid() OR NEW.status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Bookings must be requested for your own account.' USING ERRCODE = '42501'; END IF;
    SELECT * INTO chosen_service FROM public.services WHERE id = NEW.service_id;
    SELECT * INTO listing FROM public.venues WHERE id = chosen_service.venue_id;
    IF listing.id IS NULL OR listing.status <> 'approved' OR listing.timezone IS NULL OR NOT private.is_active_account(listing.owner_id) THEN
      RAISE EXCEPTION 'This provider is not ready to accept bookings.' USING ERRCODE = '22023';
    END IF;
    IF listing.owner_id = auth.uid() THEN RAISE EXCEPTION 'You cannot book your own service.' USING ERRCODE = '22023'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.list_booking_slots(NEW.service_id, (NEW.start_time AT TIME ZONE listing.timezone)::date) slots WHERE slots.start_time = NEW.start_time AND slots.available) THEN
      RAISE EXCEPTION 'That time is no longer available. Choose another appointment.' USING ERRCODE = '23P01';
    END IF;
    NEW.provider_id := listing.owner_id;
    NEW.end_time := NEW.start_time + make_interval(mins => chosen_service.duration);
    NEW.total_price := chosen_service.price;
    NEW.created_at := now();
  ELSE
    IF ROW(NEW.id, NEW.user_id, NEW.service_id, NEW.provider_id, NEW.start_time, NEW.end_time, NEW.total_price, NEW.created_at)
       IS DISTINCT FROM ROW(OLD.id, OLD.user_id, OLD.service_id, OLD.provider_id, OLD.start_time, OLD.end_time, OLD.total_price, OLD.created_at) THEN
      RAISE EXCEPTION 'Booking details are fixed. Cancel and make a new request to change them.' USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF OLD.provider_id = auth.uid() THEN
        IF NOT ((OLD.status = 'pending' AND NEW.status = 'confirmed' AND OLD.start_time > now()) OR
                (OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled') OR
                (OLD.status = 'confirmed' AND NEW.status = 'completed' AND OLD.end_time <= now())) THEN
          RAISE EXCEPTION 'This booking cannot make that status change.' USING ERRCODE = '22023';
        END IF;
      ELSIF OLD.user_id = auth.uid() THEN
        IF NOT (OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled' AND OLD.start_time > now()) THEN
          RAISE EXCEPTION 'You can cancel a pending or confirmed booking before it starts.' USING ERRCODE = '42501';
        END IF;
      ELSE RAISE EXCEPTION 'You cannot change this booking.' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_booking() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_booking BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION private.guard_booking();

CREATE FUNCTION public.change_booking_status(booking uuid, expected_status text, new_status text)
RETURNS public.bookings LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE changed public.bookings;
BEGIN
  UPDATE public.bookings SET status = new_status WHERE id = booking AND status = expected_status RETURNING * INTO changed;
  IF NOT FOUND THEN RAISE EXCEPTION 'This booking changed or is no longer available. Refresh and try again.' USING ERRCODE = '40001'; END IF;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.change_booking_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_booking_status(uuid, text, text) TO authenticated;

-- Atomic schedule replacement prevents a failed insert leaving an empty week.
CREATE FUNCTION public.save_provider_schedule(venue uuid, timezone_name text, days jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT private.is_active_account(auth.uid()) OR NOT EXISTS (SELECT 1 FROM public.venues WHERE id = venue AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the provider can edit this schedule.' USING ERRCODE = '42501';
  END IF;
  IF days IS NULL OR jsonb_typeof(days) <> 'array' OR jsonb_array_length(days) > 7 OR timezone_name IS NULL THEN
    RAISE EXCEPTION 'Choose a timezone and up to seven weekly windows.' USING ERRCODE = '22023';
  END IF;
  UPDATE public.venues SET timezone = timezone_name WHERE id = venue;
  DELETE FROM public.availability WHERE venue_id = venue;
  INSERT INTO public.availability(venue_id, day_of_week, start_time, end_time)
  SELECT venue, x.day_of_week, x.start_time, x.end_time FROM jsonb_to_recordset(days) AS x(day_of_week integer, start_time time, end_time time);
END;
$$;
REVOKE ALL ON FUNCTION public.save_provider_schedule(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_provider_schedule(uuid, text, jsonb) TO authenticated;

CREATE FUNCTION private.preserve_booking_history() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bookings WHERE service_id = OLD.id) THEN
    RAISE EXCEPTION 'This service has booking history and cannot be deleted.' USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.preserve_booking_history() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER preserve_booking_history BEFORE DELETE ON public.services FOR EACH ROW EXECUTE FUNCTION private.preserve_booking_history();
REVOKE INSERT, UPDATE, DELETE ON public.venues, public.services, public.availability FROM anon;
REVOKE ALL ON public.bookings FROM anon;
REVOKE INSERT ON public.reviews FROM anon;
COMMIT;
