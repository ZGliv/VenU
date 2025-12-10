/**
 * new/page.tsx
 * 
 * New booking page for creating venue reservations.
 * Allows users to select date/time, confirm details, and process payment.
 * Includes payment placeholder integration.
 * 
 * Exports:
 * - NewBookingPage: Booking creation page component
 */

"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Venue } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, DollarSign, Calendar, Clock } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import Link from "next/link"

export default function NewBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const venueId = searchParams.get("venue_id")
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [date, setDate] = useState("")
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push("/auth/signin")
      return
    }

    // Load venue details if venue_id is provided
    if (venueId) {
      loadVenue()
    } else {
      router.push("/explore")
    }
  }, [venueId, user, router])

  /**
   * Loads venue details from the database.
   * Fetches venue information based on venue_id parameter.
   */
  const loadVenue = async () => {
    if (!venueId) return

    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", venueId)
        .single()

      if (error) throw error
      setVenue(data)
    } catch (error) {
      console.error("Error loading venue:", error)
      alert("Failed to load venue details")
      router.push("/explore")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculates the total price based on start and end times.
   * Multiplies hourly rate by number of hours booked.
   * 
   * @returns Total price for the booking
   */
  const calculatePrice = () => {
    if (!venue || !startTime || !endTime || !date) return 0

    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    if (hours <= 0) return 0
    return Math.ceil(hours) * venue.hourly_rate
  }

  /**
   * Creates a new booking and processes payment.
   * Inserts booking record and payment placeholder into database.
   * Redirects to bookings page after successful creation.
   */
  const handleBooking = async () => {
    if (!venue || !user || !startTime || !endTime || !date) {
      alert("Please fill in all fields")
      return
    }

    const startDateTime = `${date}T${startTime}`
    const endDateTime = `${date}T${endTime}`
    const price = calculatePrice()

    if (price <= 0) {
      alert("Invalid time range")
      return
    }

    setProcessing(true)

    try {
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          venue_id: venue.id,
          user_id: user.id,
          start_time: startDateTime,
          end_time: endDateTime,
          price: price,
          status: "pending",
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create payment placeholder
      await supabase.from("payments").insert({
        booking_id: booking.id,
        amount: price,
        payment_status: "pending",
      })

      // In a real app, this would integrate with Stripe
      // For demo purposes, we'll simulate payment success
      alert("Booking created! Payment processed (demo mode).")
      router.push("/bookings")
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Failed to create booking. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading venue details...</p>
      </div>
    )
  }

  if (!venue) {
    return null
  }

  const price = calculatePrice()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/explore">
            <h1 className="text-2xl font-bold text-blue-600">VenU</h1>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Book {venue.name}</CardTitle>
              <CardDescription>Select your preferred date and time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <Button
                onClick={handleBooking}
                className="w-full"
                disabled={processing || price <= 0}
              >
                {processing ? "Processing..." : `Confirm Booking - $${price.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>

          {/* Venue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{venue.name}</h3>
                <p className="text-gray-600">{venue.description || "No description available"}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  {venue.campus}
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  ${venue.hourly_rate} per hour
                </div>
                {venue.capacity && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    Capacity: {venue.capacity} people
                  </div>
                )}
              </div>
              {price > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">${price.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

