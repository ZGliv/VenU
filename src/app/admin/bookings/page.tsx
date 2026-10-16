/**
 * admin/bookings/page.tsx
 * 
 * Admin bookings overview page.
 * Displays all platform bookings with filtering options.
 * 
 * Features:
 * - List of all bookings across platform
 * - Filter by status
 * - View booking details
 * - Platform-wide statistics
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  DollarSign,
  Loader2,
  Filter,
  Store
} from "lucide-react";

// Booking type with relations
interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  total_price: number;
  created_at: string;
  services: {
    name: string;
    duration: number;
    venues: {
      name: string;
      users: {
        name: string;
        email: string;
      };
    };
  };
  users: {
    name: string;
    email: string;
  };
}

// Status filter options
const STATUS_FILTERS = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminBookingsPage() {
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch bookings
  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services (
            name,
            duration,
            venues (
              name,
              users!venues_owner_id_fkey (name, email)
            )
          ),
          users!bookings_user_id_fkey (name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [supabase]);

  /**
   * Formats date for display.
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Formats time for display.
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /**
   * Gets status badge styling.
   */
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      confirmed: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle },
      completed: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  // Filter bookings by status
  const filteredBookings = statusFilter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

  // Calculate stats
  const totalRevenue = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">All Bookings</h1>
          <p className="text-muted-foreground">
            {bookings.length} total | ${totalRevenue.toFixed(0)} revenue (completed)
          </p>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {STATUS_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {STATUS_FILTERS.slice(1).map(filter => {
          const count = bookings.filter(b => b.status === filter.value).length;
          return (
            <div 
              key={filter.value}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-sm text-muted-foreground capitalize">{filter.label}</p>
            </div>
          );
        })}
      </div>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Service</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const statusConfig = getStatusBadge(booking.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">{booking.services?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.services?.venues?.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.users?.name || booking.users?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.services?.venues?.users?.name || 
                             booking.services?.venues?.users?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(booking.start_time)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(booking.start_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-foreground">
                          ${booking.total_price}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {statusFilter === "all" ? "No bookings yet" : `No ${statusFilter} bookings`}
          </h3>
          <p className="text-muted-foreground">
            {statusFilter === "all" 
              ? "Bookings will appear here when customers make reservations."
              : "Try selecting a different filter."}
          </p>
        </div>
      )}
    </div>
  );
}

