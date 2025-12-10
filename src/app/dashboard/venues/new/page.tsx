/**
 * new/page.tsx
 * 
 * New venue creation page for venue owners.
 * Allows venue owners to add new venues with details like name, description, campus, and hourly rate.
 * 
 * Exports:
 * - NewVenuePage: Venue creation form component
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import Link from "next/link"

export default function NewVenuePage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [campus, setCampus] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [capacity, setCapacity] = useState("")
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()
  const { user } = useAuth()
  const router = useRouter()

  /**
   * Creates a new venue in the database.
   * Inserts venue record with owner_id set to current user.
   * Redirects to dashboard after successful creation.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push("/auth/signin")
      return
    }

    if (!name || !campus || !hourlyRate) {
      alert("Please fill in all required fields")
      return
    }

    setProcessing(true)

    try {
      const { error } = await supabase.from("venues").insert({
        name,
        description: description || null,
        campus,
        hourly_rate: parseFloat(hourlyRate),
        owner_id: user.id,
        capacity: capacity ? parseInt(capacity) : null,
      })

      if (error) throw error

      alert("Venue created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating venue:", error)
      alert("Failed to create venue. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-blue-600">VenU</h1>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Add New Venue</CardTitle>
              <CardDescription>List your venue to start receiving bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Student Union Ballroom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your venue..."
                  />
                </div>
                <div>
                  <Label htmlFor="campus">Campus *</Label>
                  <Input
                    id="campus"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    placeholder="e.g., Main Campus"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="50.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity (optional)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={processing}>
                    {processing ? "Creating..." : "Create Venue"}
                  </Button>
                  <Link href="/dashboard">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

