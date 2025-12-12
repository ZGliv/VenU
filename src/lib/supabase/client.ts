/**
 * client.ts
 * 
 * Browser-side Supabase client configuration for VenU.
 * Creates a Supabase client for use in Client Components.
 * 
 * Exports:
 * - createClient: Creates a Supabase client for browser-side use
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components.
 * This client is used for browser-side operations like:
 * - Real-time subscriptions
 * - Client-side data fetching
 * - Authentication state changes
 * 
 * @returns Supabase client configured for browser use
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

