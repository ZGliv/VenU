/**
 * dev-panel.tsx
 * 
 * Development panel for testing different user roles.
 * Visible in development mode OR for admin users in production.
 * 
 * Behavior:
 * - In DEVELOPMENT: Actually switches user role in database (for testing)
 * - In PRODUCTION (admin only): "View As" mode - navigates to dashboards without changing role
 * 
 * Allows viewing/switching between:
 * - Student (customer view)
 * - Provider (venue_owner view)
 * - Admin (platform management view)
 * 
 * Features:
 * - Floating panel with toggle
 * - Quick navigation to role dashboards
 * - Current role/view indicator
 * - Admin-only visibility in production (for secure demos)
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Loader2,
  RefreshCw,
  Eye,
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
    pathPrefix: "", // Root paths
  },
  {
    value: "venue_owner",
    label: "Provider",
    description: "Manage venues and services",
    icon: Store,
    color: "bg-amber-500",
    lightColor: "bg-amber-100 text-amber-700",
    href: "/provider",
    pathPrefix: "/provider",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Platform management",
    icon: Shield,
    color: "bg-red-500",
    lightColor: "bg-red-100 text-red-700",
    href: "/admin",
    pathPrefix: "/admin",
  },
] as const;

type RoleValue = (typeof roles)[number]["value"];

/**
 * DevPanel component.
 * Floating development panel for role switching during testing.
 * In production, admins can "view as" other roles without changing their actual role.
 */
export function DevPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Check if we're in production
  const isProduction = process.env.NODE_ENV === "production";
  
  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  // Get current role configuration (actual database role)
  const currentRole = roles.find((r) => r.value === profile?.role) || roles[0];

  // Determine which view we're currently on based on the URL path
  const getCurrentView = () => {
    if (pathname?.startsWith("/admin")) return roles.find(r => r.value === "admin");
    if (pathname?.startsWith("/provider")) return roles.find(r => r.value === "venue_owner");
    return roles.find(r => r.value === "student");
  };
  const currentView = getCurrentView() || roles[0];

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

  // Only show dev panel to admin users in production, or always in development
  const showDevPanel = !isProduction || isAdmin;
  
  if (!showDevPanel) {
    return null;
  }

  /**
   * Handles clicking a role button.
   * - In production (admin): Just navigates to the dashboard (view-only mode)
   * - In development: Actually changes the role in the database
   */
  const handleRoleClick = async (targetRole: RoleValue) => {
    if (!user || switching) return;

    const roleConfig = roles.find((r) => r.value === targetRole);
    if (!roleConfig) return;

    // In production, admins just navigate without changing role
    if (isProduction && isAdmin) {
      router.push(roleConfig.href);
      setIsOpen(false);
      return;
    }

    // In development, actually switch the role in the database
    // If already this role, just navigate
    if (profile?.role === targetRole) {
      router.push(roleConfig.href);
      return;
    }

    setSwitching(true);

    try {
      // Update role in database (development only)
      const { error } = await supabase
        .from("users")
        .update({ role: targetRole })
        .eq("id", user.id);

      if (error) {
        console.error("Error switching role:", error);
        alert(`Failed to switch role: ${error.message}`);
        return;
      }

      // Refresh profile to get new role
      await refreshProfile();

      // Navigate to appropriate dashboard
      router.push(roleConfig.href);
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
              {isProduction && isAdmin && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  View Mode
                </span>
              )}
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
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          currentRole.lightColor
                        )}>
                          {currentRole.label}
                        </span>
                        {isProduction && isAdmin && currentView.value !== "admin" && (
                          <span className="text-xs text-muted-foreground">
                            viewing {currentView.label}
                          </span>
                        )}
                      </div>
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

                {/* View/Role Switcher */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {isProduction && isAdmin ? "View As" : "Switch Role"}
                  </p>
                  {roles.map((role) => {
                    // In production view mode, highlight based on current URL path
                    // In development, highlight based on actual database role
                    const isActiveView = isProduction && isAdmin 
                      ? currentView.value === role.value
                      : profile?.role === role.value;
                    const Icon = role.icon;

                    return (
                      <button
                        key={role.value}
                        onClick={() => handleRoleClick(role.value)}
                        disabled={switching}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                          isActiveView
                            ? "bg-gray-100 ring-2 ring-gray-200"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            isActiveView ? role.color : "bg-gray-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isActiveView ? "text-white" : "text-gray-500"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isActiveView
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {role.label}
                            </span>
                            {isActiveView && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                {isProduction && isAdmin ? "Viewing" : "Active"}
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
                    isProduction && isAdmin ? currentView.color : currentRole.color
                  )}
                >
                  {isProduction && isAdmin ? (
                    <currentView.icon className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <currentRole.icon className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {isProduction && isAdmin ? `Viewing: ${currentView.label}` : currentRole.label}
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
