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

// Environment variables with fallbacks for build time
// During build, these may be empty - that's OK for static generation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Creates a Supabase client for use in Client Components.
 * This client is used for browser-side operations like:
 * - Real-time subscriptions
 * - Client-side data fetching
 * - Authentication state changes
 * 
 * @returns Supabase client configured for browser use, or null during build
 */
export function createClient() {
  // During build time, env vars may not be available
  // Return a dummy client that won't be used during static generation
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time - pages using this are client-side anyway
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

