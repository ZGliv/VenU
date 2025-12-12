/**
 * 0004_add_table_grants.sql
 * 
 * Grants table-level permissions to anon and authenticated roles.
 * This is required for Supabase clients to interact with tables.
 * 
 * RLS policies control WHICH rows can be accessed, but GRANT permissions
 * control WHETHER the table can be accessed at all.
 * 
 * Grants:
 * - SELECT, INSERT, UPDATE, DELETE on all public tables
 * - USAGE and SELECT on all sequences (for auto-incrementing IDs)
 */

-- ============================================
-- USERS TABLE GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- ============================================
-- VENUES TABLE GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;

-- ============================================
-- SERVICES TABLE GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

-- ============================================
-- BOOKINGS TABLE GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;

-- ============================================
-- REVIEWS TABLE GRANTS
-- ============================================
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;

-- ============================================
-- AVAILABILITY TABLE GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability TO authenticated;

-- ============================================
-- SEQUENCE GRANTS (for UUID generation)
-- ============================================
-- Grant usage on all sequences in public schema
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

