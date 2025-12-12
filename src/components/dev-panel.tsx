/**
 * dev-panel.tsx
 * 
 * Development panel for testing different user roles.
 * Visible in development mode OR for admin users in production.
 * Allows switching between:
 * - Student (customer view)
 * - Provider (venue_owner view)
 * - Admin (platform management view)
 * 
 * Features:
 * - Floating panel with toggle
 * - Quick role switching with navigation to role dashboards
 * - Current role indicator
 * - Admin-only visibility in production (for secure demos)
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Code,
  User,
  Store,
  Shield,
  ChevronUp,
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Role configuration with labels, colors, and dashboard paths
const roles = [
  {
    value: "student",
    label: "Student",
    description: "Browse and book services",
    icon: User,
    color: "bg-blue-500",
    lightColor: "bg-blue-100 text-blue-700",
    href: "/",
  },
  {
    value: "venue_owner",
    label: "Provider",
    description: "Manage venues and services",
    icon: Store,
    color: "bg-amber-500",
    lightColor: "bg-amber-100 text-amber-700",
    href: "/provider",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Platform management",
    icon: Shield,
    color: "bg-red-500",
    lightColor: "bg-red-100 text-red-700",
    href: "/admin",
  },
] as const;

type RoleValue = (typeof roles)[number]["value"];

/**
 * DevPanel component.
 * Floating development panel for role switching during testing.
 * Only renders in development environment.
 */
export function DevPanel() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get current role configuration
  const currentRole = roles.find((r) => r.value === profile?.role) || roles[0];

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Only show dev panel to admin users (allows role switching for demos)
  // In development, always show. In production, only show if user is admin.
  const isAdmin = profile?.role === "admin";
  const showDevPanel = process.env.NODE_ENV === "development" || isAdmin;
  
  if (!showDevPanel) {
    return null;
  }

  /**
   * Switches the current user's role in the database.
   * Updates the users table and refreshes the profile.
   * Navigates to the appropriate dashboard for the selected role.
   */
  const handleRoleSwitch = async (newRole: RoleValue) => {
    if (!user || switching) return;

    // Get the role configuration for navigation
    const roleConfig = roles.find((r) => r.value === newRole);

    // If already this role, just navigate to the dashboard
    if (profile?.role === newRole) {
      if (roleConfig) {
        router.push(roleConfig.href);
      }
      return;
    }

    setSwitching(true);

    try {
      // Update role in database
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", user.id);

      if (error) {
        console.error("Error switching role:", error);
        alert(`Failed to switch role: ${error.message}`);
        return;
      }

      // Refresh profile to get new role
      await refreshProfile();

      // Navigate to appropriate dashboard for the new role
      if (roleConfig) {
        router.push(roleConfig.href);
      }
    } catch (err) {
      console.error("Error switching role:", err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]" ref={panelRef}>
      {/* Main Panel */}
      <div
        className={cn(
          "bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300",
          isOpen ? "w-72" : "w-auto"
        )}
      >
        {/* Expanded Content */}
        {isOpen && (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Code className="h-5 w-5 text-violet-600" />
              <span className="font-semibold text-foreground">Dev Panel</span>
              {switching && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
              )}
            </div>

            {/* Auth Status */}
            {authLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading auth...
              </div>
            ) : !user ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to switch roles
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/auth/signin")}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <>
                {/* Current User */}
                <div className="mb-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm font-semibold text-white">
                      {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => refreshProfile()}
                      title="Refresh profile"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Switch Role
                  </p>
                  {roles.map((role) => {
                    const isCurrentRole = profile?.role === role.value;
                    const Icon = role.icon;

                    return (
                      <button
                        key={role.value}
                        onClick={() => handleRoleSwitch(role.value)}
                        disabled={switching}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                          isCurrentRole
                            ? "bg-gray-100 ring-2 ring-gray-200"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            isCurrentRole ? role.color : "bg-gray-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isCurrentRole ? "text-white" : "text-gray-500"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isCurrentRole
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {role.label}
                            </span>
                            {isCurrentRole && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {role.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-3 p-3 transition-colors",
            isOpen
              ? "border-t border-gray-100 hover:bg-gray-50"
              : "hover:bg-gray-50"
          )}
        >
          {isOpen ? (
            <span className="flex-1 text-center text-sm font-medium text-foreground">
              Close
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center",
                    currentRole.color
                  )}
                >
                  <currentRole.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {currentRole.label}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

