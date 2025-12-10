/**
 * callback/route.ts
 * 
 * OAuth callback route handler.
 * Handles the redirect from Google OAuth and exchanges the code for a session.
 * Redirects users to the explore page after successful authentication.
 * 
 * Exports:
 * - GET: Route handler for OAuth callback
 */

import { createRouteHandlerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Handles OAuth callback from Google.
 * Exchanges the authorization code for a session token.
 * Creates or updates user record in the database.
 * 
 * @param request - Next.js request object containing OAuth code
 * @returns Redirect response to explore page or error page
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createRouteHandlerClient()
    
    // Exchange code for session - this should set cookies automatically
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Error exchanging code for session:", error)
      // Redirect to sign-in page with error
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }

    // Verify session was created
    if (data.session) {
      console.log("Session created successfully for user:", data.session.user.email)
      
      // Create redirect response - createRouteHandlerClient should have set cookies automatically
      const redirectUrl = new URL("/?auth=success", requestUrl.origin)
      const response = NextResponse.redirect(redirectUrl)
      
      // Ensure cookies are copied to the response
      // The route handler client should handle this, but we'll ensure it
      const cookieStore = cookies()
      const allCookies = cookieStore.getAll()
      
      // Copy all cookies to the response
      allCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value)
      })
      
      return response
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}

