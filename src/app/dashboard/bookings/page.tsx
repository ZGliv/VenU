/**
 * dashboard/bookings/page.tsx
 * 
 * User bookings page.
 * Displays all bookings made by the current user.
 * 
 * Features:
 * - List of user's bookings
 * - Filter by status
 * - Cancel booking functionality
 * - Booking details display
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeft
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
      id: string;
      name: string;
      campus: string;
      image_url: string | null;
    };
  };
}

export default function UserBookingsPage() {
  const { user } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Fetch bookings
  useEffect(() => {
    if (!user) return;

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
              id,
              name,
              campus,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("start_time", { ascending: false });

      if (!error) {
        setBookings(data || []);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [user, supabase]);

  /**
   * Cancels a booking.
   */
  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (!error) {
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: "cancelled" } : b
      ));
    }
    setCancelling(null);
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
      pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending", icon: Clock },
      confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Confirmed", icon: CheckCircle },
      completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled", icon: XCircle },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  // Group bookings
  const upcomingBookings = bookings.filter(b => 
    ["pending", "confirmed"].includes(b.status) && new Date(b.start_time) >= new Date()
  );
  const pastBookings = bookings.filter(b => 
    b.status === "completed" || b.status === "cancelled" || new Date(b.start_time) < new Date()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-1">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your appointments
        </p>
      </div>

      {/* Upcoming Bookings */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming</h2>
        
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const statusConfig = getStatusBadge(booking.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div 
                  key={booking.id} 
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {booking.services?.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <Link 
                        href={`/dashboard/venues/${booking.services?.venues?.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {booking.services?.venues?.name}
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(booking.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(booking.start_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {booking.services?.venues?.campus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          ${booking.total_price}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.services?.duration} mins
                        </p>
                      </div>

                      {booking.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelBooking(booking.id)}
                          disabled={cancelling === booking.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {cancelling === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Cancel"
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
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No upcoming bookings</p>
            <Link href="/explore">
              <Button>Browse Services</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Past Bookings</h2>
          
          <div className="space-y-4">
            {pastBookings.map((booking) => {
              const statusConfig = getStatusBadge(booking.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div 
                  key={booking.id} 
                  className="bg-white rounded-xl border border-gray-200 p-5 opacity-75"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {booking.services?.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {booking.services?.venues?.name}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{formatDate(booking.start_time)}</span>
                        <span>{formatTime(booking.start_time)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${booking.total_price}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

