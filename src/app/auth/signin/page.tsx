/**
 * signin/page.tsx
 * 
 * Sign-in page for VenU.
 * Provides Google OAuth authentication via Supabase.
 * Redirects authenticated users (with valid profile) to the home page.
 * 
 * Features:
 * - Clean, modern sign-in UI
 * - Google OAuth integration
 * - Loading state handling
 * - Error display
 * - Only redirects if user has both session AND profile (prevents stale session issues)
 */

"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const { user, profile, loading } = useAuth();
  
  // Get error message from URL if present
  const errorMessage = searchParams.get("error");

  // Redirect if already signed in with a valid profile
  // Only redirect if BOTH user AND profile exist (profile confirms user is in database)
  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        // User is fully authenticated, redirect to home
        const timer = setTimeout(() => {
          router.push("/");
        }, 300);
        return () => clearTimeout(timer);
      } else if (user && !profile) {
        // User has stale session (no profile in DB), sign them out
        supabase.auth.signOut();
      }
    }
  }, [user, profile, loading, router, supabase]);

  /**
   * Initiates Google OAuth sign-in flow.
   * Redirects user to Google authentication page.
   */
  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Error signing in:", error);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Decorative gradient blobs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-amber-500/[0.07] rounded-full blur-3xl" />
        
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl">VenU</span>
          </Link>
          
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Your campus marketplace
            </h2>
            <p className="text-slate-300 text-lg max-w-md">
              Connect with student entrepreneurs and local providers. 
              Book services, manage appointments, and grow your business.
            </p>
          </div>
          
          <div className="text-sm text-slate-400">
            2024 VenU Inc.
          </div>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to home</span>
          </Link>
          
          {/* Sign in card */}
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 text-sm font-medium mb-4 border border-blue-100">
                <Sparkles className="h-4 w-4" />
                Welcome to VenU
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Sign in to your account
              </h1>
              <p className="text-muted-foreground">
                Access your bookings and manage your services
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Sign in button */}
          <Button
            onClick={handleSignIn}
            size="lg"
              className="w-full h-14 text-base font-medium bg-white hover:bg-gray-50 text-foreground border border-gray-200 shadow-sm"
          >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                  fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                  fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                  fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                  fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
              Continue with Google
          </Button>
          
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {/* Alternative actions */}
            <div className="space-y-3">
              <Link href="/explore" className="block">
                <Button variant="outline" size="lg" className="w-full h-12 border-gray-200">
                  Browse as Guest
                </Button>
              </Link>
            </div>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
