/**
 * navbar.tsx
 * 
 * Main navigation component for VenU.
 * Premium, minimal design with subtle glass effect.
 * Displays the site logo, navigation links, and user authentication state.
 * 
 * Navigation Logic:
 * - All users see "Provider Dashboard" link (to encourage becoming a provider)
 * - Admin users additionally see "Admin Dashboard" link
 * - All users see "Settings" link
 * 
 * Exports:
 * - Navbar: Main navigation bar component
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { User, LogOut, Store, Shield, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Navbar component.
 * Renders the main navigation bar with responsive auth state.
 * Shows user menu when logged in, login button when logged out.
 */
export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();

  /**
   * Gets the role display text with proper formatting.
   */
  const getRoleDisplay = () => {
    if (profile?.role === "admin") return "Admin";
    if (profile?.role === "venue_owner") return "Provider";
    return "Student";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo and main nav */}
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2" href="/">
            <span className="font-bold text-xl tracking-tight text-slate-900">VenU</span>
          </Link>
          
          {/* Main navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/explore" 
              className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
            >
              Explore
            </Link>
          </nav>
        </div>

        {/* Right side: auth state */}
        <div className="flex items-center gap-3">
          {/* Show "For Business" link if not a venue owner */}
          {(!profile || profile.role === "student") && (
            <>
              <Link 
                href="/become-provider" 
                className="hidden sm:flex px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
              >
                Become a Provider
              </Link>
            </>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse" />
          ) : user && profile ? (
            /* Logged in: show user dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 h-10 px-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                >
                  {/* Avatar with gradient background */}
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center text-xs font-semibold">
                    {profile.name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{profile.name || "Account"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-white border-slate-200 shadow-elevation-3 rounded-xl p-1"
              >
                {/* User info header */}
                <div className="px-3 py-3 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-900">{profile.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                      {getRoleDisplay()}
                    </span>
                  </div>
                </div>
                
                {/* Admin Dashboard - only visible to admins */}
                {profile?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/admin" 
                      className="flex items-center cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                {/* Provider Dashboard - visible to everyone to encourage becoming a provider */}
                <DropdownMenuItem asChild>
                  <Link 
                    href="/provider" 
                    className="flex items-center cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Provider Dashboard
                  </Link>
                </DropdownMenuItem>
                
                {/* Settings */}
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/settings" 
                    className="flex items-center cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1" />
                
                {/* Sign out */}
                <DropdownMenuItem 
                  onClick={signOut}
                  className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg px-3 py-2 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Logged out: show login button */
            <Link href="/auth/signin">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 h-10 rounded-xl shadow-sm">
                Log in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
