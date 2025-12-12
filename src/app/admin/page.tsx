/**
 * admin/page.tsx
 * 
 * Admin dashboard overview page.
 * Displays platform metrics, recent activity, and quick actions.
 * 
 * Features:
 * - Platform statistics cards
 * - Recent venues pending approval
 * - Recent bookings activity
 * - Quick action links
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Users,
  Store,
  ClipboardList,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle
} from "lucide-react";

// Stats card component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  href,
  color = "bg-white"
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: string;
  href?: string;
  color?: string;
}) {
  const content = (
    <div className={`${color} rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow`}>
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

export default function AdminDashboard() {
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    pendingVenues: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [pendingVenues, setPendingVenues] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      // Fetch user count
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Fetch venue counts
      const { data: allVenues, error: venuesError } = await supabase
        .from("venues")
        .select("id, status");
      
      if (venuesError) {
        console.error("Error fetching venues:", venuesError);
      }
      
      const venueCount = allVenues?.length || 0;
      const pendingCount = allVenues?.filter(v => v.status === "pending").length || 0;

      // Fetch pending venues for display - fetch venues first, then get user info separately
      const { data: pendingVenuesData, error: pendingError } = await supabase
        .from("venues")
        .select(`
          *,
          users:owner_id (name, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (pendingError) {
        console.error("Error fetching pending venues:", pendingError);
      }

      // Fetch booking stats
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          services (name, venues (name)),
          users:user_id (name, email)
        `)
        .order("created_at", { ascending: false });

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
      }

      const totalRevenue = bookings
        ?.filter(b => b.status === "completed")
        .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalVenues: venueCount,
        pendingVenues: pendingCount,
        totalBookings: bookings?.length || 0,
        totalRevenue,
      });

      setPendingVenues(pendingVenuesData || []);
      setRecentBookings((bookings || []).slice(0, 5));
      setLoading(false);
    }

    fetchDashboardData();
  }, [supabase]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users}
          href="/admin/users"
        />
        <StatCard 
          title="Total Venues" 
          value={stats.totalVenues} 
          icon={Store}
          href="/admin/venues"
        />
        <StatCard 
          title="Pending Approval" 
          value={stats.pendingVenues} 
          icon={Clock}
          href="/admin/venues?status=pending"
          color={stats.pendingVenues > 0 ? "bg-amber-50" : "bg-white"}
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toFixed(0)}`} 
          icon={DollarSign}
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Venues */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-foreground">Pending Approval</h2>
            </div>
            <Link href="/admin/venues?status=pending">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : pendingVenues.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingVenues.map((venue) => (
                <div key={venue.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{venue.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {venue.users?.name || venue.users?.email} | {venue.category}
                      </p>
                    </div>
                    <Link href={`/admin/venues?id=${venue.id}`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-muted-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No venues pending approval.</p>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Bookings</h2>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
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
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        booking.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                        booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
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
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No bookings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

