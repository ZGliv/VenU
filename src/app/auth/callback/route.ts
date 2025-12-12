/**
 * callback/route.ts
 * 
 * OAuth callback route handler.
 * Handles the redirect from Google OAuth and exchanges the code for a session.
 * Always redirects users to the homepage regardless of role.
 * 
 * Exports:
 * - GET: Route handler for OAuth callback
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Handles OAuth callback from Google.
 * Exchanges the authorization code for a session token.
 * Uses a custom Supabase client that properly handles cookie setting in the response.
 * 
 * @param request - Next.js request object containing OAuth code
 * @returns Redirect response to home page or error page with proper cookies
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    
    // Create Supabase client with proper cookie handling for route handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );
    
    // Exchange code for session - cookies are set via cookieStore
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      // Redirect to sign-in page with error message
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Session created successfully, always redirect to homepage
    if (data.session) {
      console.log("Session created successfully for user:", data.session.user.email);
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}

