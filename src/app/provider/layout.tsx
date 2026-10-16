/**
 * provider/layout.tsx
 * 
 * Layout component for the provider dashboard.
 * Provides sidebar navigation and consistent structure for all provider pages.
 * Protected route - only accessible by venue_owner and admin roles.
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Mobile-friendly collapsible menu
 * - Route-aware active states
 * - User profile in sidebar
 * - Role-based access control
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { RouteGuard } from "@/components/providers/route-guard";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Calendar, 
  ClipboardList, 
  Settings, 
  Menu, 
  X,
  Home,
  LogOut,
  ChevronRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items for the provider sidebar
const navItems = [
  { 
    label: "Overview", 
    href: "/provider", 
    icon: Home,
    exact: true 
  },
  { 
    label: "My Venues", 
    href: "/provider/venues", 
    icon: Store 
  },
  { 
    label: "Availability", 
    href: "/provider/availability", 
    icon: Calendar 
  },
  { 
    label: "Bookings", 
    href: "/provider/bookings", 
    icon: ClipboardList 
  },
  { 
    label: "Settings", 
    href: "/provider/settings", 
    icon: Settings 
  },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * Checks if a nav item is currently active based on the pathname.
   */
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <RouteGuard allowedRoles={["venue_owner", "admin"]}>
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between">
        <Link href="/provider" className="font-bold text-xl text-foreground">
          VenU
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? "Close provider menu" : "Open provider menu"}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-foreground">VenU</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Provider
              </span>
            </Link>
          </div>

          {/* Quick action */}
          <div className="p-4">
            <Link href="/provider/venues/new">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add New Venue
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active 
                          ? "bg-gray-100 text-foreground" 
                          : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.name || "Provider"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
    </RouteGuard>
  );
}

