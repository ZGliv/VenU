/**
 * provider/bookings/page.tsx
 * 
 * Provider bookings management page.
 * Displays all bookings for the provider's venues with filtering and actions.
 * 
 * Features:
 * - List of all bookings across venues
 * - Filter by status
 * - Confirm/cancel booking actions
 * - Customer and service details
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown
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

export default function ProviderBookingsPage() {
  const { user } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch bookings
  useEffect(() => {
    if (!user) return;

    async function fetchBookings() {
      setLoading(true);

      // First get user's venues
      const { data: venues } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user?.id);

      if (!venues || venues.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const venueIds = venues.map(v => v.id);

      // Get services for these venues
      const { data: services } = await supabase
        .from("services")
        .select("id")
        .in("venue_id", venueIds);

      if (!services || services.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const serviceIds = services.map(s => s.id);

      // Get bookings for these services
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          services (
            name,
            duration,
            venues (name)
          ),
          users (name, email)
        `)
        .in("service_id", serviceIds)
        .order("start_time", { ascending: false });

      setBookings(bookingsData || []);
      setLoading(false);
    }

    fetchBookings();
  }, [user, supabase]);

  /**
   * Updates booking status.
   */
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (!error) {
      setBookings(prev => prev.map(b => 
        b.id === bookingId 
          ? { ...b, status: newStatus as Booking["status"] }
          : b
      ));
    }

    setUpdating(null);
  };

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
          <h1 className="text-2xl font-bold text-foreground mb-1">Bookings</h1>
          <p className="text-muted-foreground">
            Manage customer appointments
          </p>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[160px] justify-between">
                {STATUS_FILTERS.find(f => f.value === statusFilter)?.label || "All Bookings"}
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                {STATUS_FILTERS.map(filter => (
                  <DropdownMenuRadioItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusConfig = getStatusBadge(booking.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={booking.id} 
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {booking.services?.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {booking.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {booking.services?.venues?.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.start_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {booking.users?.name || booking.users?.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${booking.total_price}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {booking.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          disabled={updating === booking.id}
                        >
                          {updating === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          disabled={updating === booking.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        disabled={updating === booking.id}
                      >
                        {updating === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {statusFilter === "all" ? "No bookings yet" : `No ${statusFilter} bookings`}
          </h3>
          <p className="text-muted-foreground">
            {statusFilter === "all" 
              ? "Bookings will appear here when customers book your services."
              : "Try selecting a different filter."}
          </p>
        </div>
      )}
    </div>
  );
}

