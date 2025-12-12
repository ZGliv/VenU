/**
 * provider/page.tsx
 * 
 * Provider dashboard overview page.
 * Displays key metrics, recent bookings, and quick actions.
 * 
 * Features:
 * - Booking statistics cards
 * - Recent bookings list
 * - Quick action buttons
 * - Venue status overview
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Calendar, 
  DollarSign, 
  Users,
  ArrowRight,
  Clock,
  Plus,
  TrendingUp
} from "lucide-react";

// Stats card component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  href 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gray-100">
          <Icon className="h-6 w-6 text-foreground" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function ProviderDashboard() {
  const { user, profile } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      setLoading(true);

      // Fetch user's venues
      const { data: venues } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id);

      const venueIds = venues?.map(v => v.id) || [];
      
      if (venueIds.length > 0) {
        // Fetch services for these venues
        const { data: services } = await supabase
          .from("services")
          .select("id")
          .in("venue_id", venueIds);

        const serviceIds = services?.map(s => s.id) || [];

        if (serviceIds.length > 0) {
          // Fetch bookings for these services
          const { data: bookings } = await supabase
            .from("bookings")
            .select(`
              *,
              services (
                name,
                price,
                venues (name)
              ),
              users (name, email)
            `)
            .in("service_id", serviceIds)
            .order("created_at", { ascending: false });

          const allBookings = bookings || [];
          const pendingCount = allBookings.filter(b => b.status === "pending").length;
          const totalEarnings = allBookings
            .filter(b => b.status === "completed")
            .reduce((sum, b) => sum + (b.total_price || 0), 0);

          setStats({
            totalVenues: venueIds.length,
            totalBookings: allBookings.length,
            pendingBookings: pendingCount,
            totalEarnings,
          });

          setRecentBookings(allBookings.slice(0, 5));
        } else {
          setStats({
            totalVenues: venueIds.length,
            totalBookings: 0,
            pendingBookings: 0,
            totalEarnings: 0,
          });
        }
      }

      setLoading(false);
    }

    fetchDashboardData();
  }, [user, supabase]);

  // Format booking status for display
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Welcome back, {profile?.name?.split(" ")[0] || "Provider"}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your venues today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Venues" 
          value={stats.totalVenues} 
          icon={Store}
          href="/provider/venues"
        />
        <StatCard 
          title="Total Bookings" 
          value={stats.totalBookings} 
          icon={Calendar}
          href="/provider/bookings"
        />
        <StatCard 
          title="Pending" 
          value={stats.pendingBookings} 
          icon={Clock}
          href="/provider/bookings?status=pending"
        />
        <StatCard 
          title="Total Earnings" 
          value={`$${stats.totalEarnings.toFixed(0)}`} 
          icon={DollarSign}
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Bookings</h2>
            <Link href="/provider/bookings">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {booking.services?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.users?.name || booking.users?.email} 
                        {" - "}
                        {booking.services?.venues?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${booking.total_price}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No bookings yet</p>
              <p className="text-sm text-muted-foreground">
                Bookings will appear here when customers book your services.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/provider/venues/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Venue
                </Button>
              </Link>
              <Link href="/provider/availability" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Availability
                </Button>
              </Link>
              <Link href="/provider/bookings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Manage Bookings
                </Button>
              </Link>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-2">Grow Your Business</h3>
            <p className="text-sm text-gray-300 mb-4">
              Complete your venue profile and add high-quality photos to attract more customers.
            </p>
            <Link href="/provider/venues">
              <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
                Manage Venues
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

