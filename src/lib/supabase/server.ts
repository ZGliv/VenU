/**
 * server.ts
 * 
 * Server-side Supabase client configuration for VenU.
 * Creates authenticated Supabase clients for use in Server Components and Route Handlers.
 * Handles cookie-based session management for SSR.
 * 
 * Exports:
 * - createClient: Creates a Supabase client for Server Components
 * - createRouteHandlerClient: Creates a Supabase client for Route Handlers (with cookie write support)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

/**
 * Creates a Supabase client for use in Server Components.
 * Handles reading and writing cookies for session management.
 * Cookie writes may fail in Server Components (handled by middleware).
 * 
 * @returns Supabase client configured for server-side use
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for use in Route Handlers (API routes).
 * Route Handlers can write cookies directly, so this client has full cookie support.
 * Used for OAuth callbacks and other authentication flows.
 * 
 * @returns Supabase client configured for route handler use
 */
export function createRouteHandlerClient() {
  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Route handlers can write cookies directly
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Route handlers can delete cookies directly
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

