/**
 * book/[venueId]/[serviceId]/page.tsx
 * 
 * Booking page for selecting a time slot and confirming a booking.
 * Fetches provider availability and existing bookings to show available slots.
 * 
 * Features:
 * - Date picker for selecting booking date
 * - Available time slots based on provider schedule
 * - Booking confirmation
 * - Price summary
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";

// Service type
interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  venue_id: string;
}

// Venue type
interface Venue {
  id: string;
  name: string;
  campus: string;
  image_url: string | null;
}

// Availability type
interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

// Time slot type
interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const venueId = params.venueId as string;
  const serviceId = params.serviceId as string;
  
  const [service, setService] = useState<Service | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch service and venue data
  useEffect(() => {
    async function fetchData() {
      // Fetch service
      const { data: serviceData } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();

      if (serviceData) {
        setService(serviceData);

        // Fetch venue
        const { data: venueData } = await supabase
          .from("venues")
          .select("*")
          .eq("id", serviceData.venue_id)
          .single();

        if (venueData) {
          setVenue(venueData);

          // Fetch availability
          const { data: availData } = await supabase
            .from("availability")
            .select("*")
            .eq("venue_id", venueData.id);

          setAvailability(availData || []);

          // Fetch existing bookings
          const { data: bookingsData } = await supabase
            .from("bookings")
            .select("*")
            .eq("service_id", serviceId)
            .in("status", ["pending", "confirmed"]);

          setExistingBookings(bookingsData || []);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [serviceId, supabase]);

  // Generate time slots when date changes
  useEffect(() => {
    if (!service || !availability.length) {
      setTimeSlots([]);
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);

    if (!dayAvailability) {
      setTimeSlots([]);
      return;
    }

    // Generate slots
    const slots: TimeSlot[] = [];
    const [startHour, startMin] = dayAvailability.start_time.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.end_time.split(":").map(Number);

    const startDate = new Date(selectedDate);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(endHour, endMin, 0, 0);

    let currentSlot = new Date(startDate);

    while (currentSlot.getTime() + service.duration * 60000 <= endDate.getTime()) {
      const slotEnd = new Date(currentSlot.getTime() + service.duration * 60000);
      
      // Check if slot conflicts with existing bookings
      const isBooked = existingBookings.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return (
          (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (currentSlot <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      // Check if slot is in the past
      const isPast = currentSlot < new Date();

      slots.push({
        start: new Date(currentSlot),
        end: slotEnd,
        available: !isBooked && !isPast,
      });

      // Move to next slot (30 min intervals)
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }

    setTimeSlots(slots);
    setSelectedSlot(null);
  }, [selectedDate, service, availability, existingBookings]);

  /**
   * Navigate to previous day.
   */
  const prevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
      setSelectedDate(newDate);
    }
  };

  /**
   * Navigate to next day.
   */
  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Limit to 30 days ahead
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  /**
   * Formats time for display.
   */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /**
   * Handles booking confirmation.
   * Validates user has a profile before attempting to create booking.
   */
  const handleBook = async () => {
    if (!user || !profile || !selectedSlot || !service) {
      setError("Please sign in to complete your booking.");
      return;
    }

    setBooking(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        service_id: service.id,
        start_time: selectedSlot.start.toISOString(),
        end_time: selectedSlot.end.toISOString(),
        status: "pending",
        total_price: service.price,
      });

    if (insertError) {
      // Provide a user-friendly error message for common issues
      if (insertError.message.includes("foreign key constraint")) {
        setError("Your session has expired. Please sign out and sign back in.");
      } else {
        setError(insertError.message);
      }
      setBooking(false);
      return;
    }

    setSuccess(true);
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!service || !venue) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/explore">
            <Button>Browse Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Your appointment has been submitted. The provider will confirm shortly.
          </p>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-left mb-8">
            <h2 className="font-semibold text-foreground mb-4">Booking Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venue</span>
                <span className="font-medium text-foreground">{venue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">
                  {selectedSlot?.start.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">
                  {selectedSlot && formatTime(selectedSlot.start)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">${service.price}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/bookings">
              <Button>View My Bookings</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline">Browse More</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is logged in and has a profile
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to book this service.
          </p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 mesh-gradient" />
      
      {/* Floating decorative blobs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-violet-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Back link */}
        <Link 
          href={`/dashboard/venues/${venueId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to venue
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Book Appointment</h1>
              <p className="text-muted-foreground">Select a date and time for your appointment</p>
            </div>

            {/* Date Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Date
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevDay}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-foreground min-w-[180px] text-center">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextDay}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Times
              </h2>

              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      disabled={!slot.available}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSlot?.start.getTime() === slot.start.getTime()
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-violet-500/25"
                          : slot.available
                            ? "bg-white border border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50"
                            : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No available times for this date.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try selecting a different day.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              {/* Service Info */}
              <div className="flex gap-4 pb-4 border-b border-gray-100 mb-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                  {venue.image_url && (
                    <Image
                      src={venue.image_url}
                      alt={venue.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{venue.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {venue.campus}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">{service.duration} mins</span>
                </div>
                {selectedSlot && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground">
                        {selectedSlot.start.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium text-foreground">
                        {formatTime(selectedSlot.start)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-foreground text-lg">${service.price}</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Book Button */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-violet-500/25" 
                size="lg"
                onClick={handleBook}
                disabled={!selectedSlot || booking}
              >
                {booking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {selectedSlot ? "Confirm Booking" : "Select a Time Slot"}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                You won't be charged until the appointment is confirmed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

