/**
 * admin/layout.tsx
 * 
 * Layout component for the admin dashboard.
 * Provides sidebar navigation and consistent structure for all admin pages.
 * Protected route - only accessible by admin role.
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Mobile-friendly collapsible menu
 * - Route-aware active states
 * - Admin-only access indicator
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
  LayoutDashboard,
  Users,
  Store,
  ClipboardList,
  Menu, 
  X,
  Home,
  LogOut,
  ChevronRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items for the admin sidebar
const navItems = [
  { 
    label: "Overview", 
    href: "/admin", 
    icon: LayoutDashboard,
    exact: true 
  },
  { 
    label: "Users", 
    href: "/admin/users", 
    icon: Users 
  },
  { 
    label: "Venues", 
    href: "/admin/venues", 
    icon: Store 
  },
  { 
    label: "Bookings", 
    href: "/admin/bookings", 
    icon: ClipboardList 
  },
];

export default function AdminLayout({
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
    <RouteGuard allowedRoles={["admin"]}>
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between">
        <Link href="/admin" className="font-bold text-xl text-foreground flex items-center gap-2">
          VenU
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            Admin
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
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
        "fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-white">VenU</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                Admin
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
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
                          ? "bg-white/10 text-white" 
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
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
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Administrator
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button 
                  size="sm" 
                  className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20 font-medium"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button 
                size="sm"
                onClick={signOut}
                className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-medium"
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

