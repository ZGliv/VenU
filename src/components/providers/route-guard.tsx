/**
 * route-guard.tsx
 * 
 * Route protection component for role-based access control.
 * Redirects users based on their authentication state and role.
 * 
 * Features:
 * - Require authentication
 * - Require specific roles
 * - Loading state while checking
 * - Automatic redirects
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ("student" | "venue_owner" | "admin")[];
  redirectTo?: string;
}

/**
 * RouteGuard component.
 * Wraps pages that require authentication or specific roles.
 * 
 * @param children - Page content to render
 * @param requireAuth - Whether authentication is required (default: true)
 * @param allowedRoles - Array of roles that can access this route
 * @param redirectTo - Where to redirect unauthorized users
 */
export function RouteGuard({ 
  children, 
  requireAuth = true,
  allowedRoles,
  redirectTo = "/auth/signin"
}: RouteGuardProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Still loading auth state
    if (loading) return;

    // Not authenticated
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Check role restrictions
    if (user && profile && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard based on role
        if (profile.role === "admin") {
          router.push("/admin");
        } else if (profile.role === "venue_owner") {
          router.push("/provider");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, profile, loading, requireAuth, allowedRoles, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  // Wrong role
  if (user && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

