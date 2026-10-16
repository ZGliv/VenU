/**
 * types.ts
 * 
 * Shared TypeScript type definitions for the VenU application.
 * Contains interfaces for database entities and API responses.
 */

/**
 * Venue interface representing a service location.
 * Used across booking and venue management features.
 */
export interface Venue {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  campus: string;
  timezone: string | null;
  image_url: string | null;
  category: string;
  status: "pending" | "approved" | "rejected";
  hourly_rate?: number;
  capacity?: number | null;
  provider_name: string | null;
  provider_email: string | null;
  provider_phone: string | null;
  admin_message: string | null;
  status_updated_by: string | null;
  status_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Service interface representing a bookable service within a venue.
 */
export interface Service {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  created_at: string;
}

/**
 * Booking interface representing a customer reservation.
 */
export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  total_price: number;
  created_at: string;
}

/**
 * User profile interface from public.users table.
 */
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: "student" | "venue_owner" | "admin";
  avatar_url: string | null;
  campus: string | null;
  created_at: string;
}

/**
 * Availability interface for venue operating hours.
 */
export interface Availability {
  id: string;
  venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}
