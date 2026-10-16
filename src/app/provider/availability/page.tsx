/**
 * provider/availability/page.tsx
 * 
 * Availability management page for providers.
 * Allows setting weekly availability windows for each venue.
 * 
 * Features:
 * - Select venue to manage
 * - Set availability for each day of the week
 * - Toggle days on/off
 * - Set start and end times
 */

"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { bookingError } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock,
  Loader2,
  Check,
  Store
} from "lucide-react";

// Days of the week
const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

// Venue type
interface Venue {
  id: string;
  name: string;
  timezone: string | null;
}

// Availability type
interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleFailed, setScheduleFailed] = useState(false);
  const [timezone, setTimezone] = useState("");

  // Initialize availability for all days
  useEffect(() => {
    const initialAvailability = DAYS.map(day => ({
      day_of_week: day.value,
      start_time: "09:00",
      end_time: "17:00",
      enabled: false,
    }));
    setAvailability(initialAvailability);
  }, []);

  // Fetch venues
  useEffect(() => {
    if (!user) return;

    async function fetchVenues() {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, timezone")
        .eq("owner_id", user?.id);

      if (error) setError("We couldn’t load your providers. Please try again.");
      if (data && data.length > 0) {
        setVenues(data);
        setSelectedVenueId(data[0].id);
      }
      setLoading(false);
    }

    fetchVenues();
  }, [user, supabase]);

  // A stale response must not replace the schedule after switching providers.
  useEffect(() => {
    if (!selectedVenueId) return;
    let current = true;
    setScheduleLoading(true); setScheduleFailed(false); setError(null);
    setTimezone(venues.find(venue => venue.id === selectedVenueId)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    supabase.from("availability").select("*").eq("venue_id", selectedVenueId).then(({ data, error }) => {
      if (!current) return;
      if (error) { setScheduleFailed(true); setError("We couldn’t load this schedule. Reload before saving changes."); }
      else setAvailability(DAYS.map(day => {
        const existing = data?.find(item => item.day_of_week === day.value);
        return { day_of_week: day.value, start_time: existing?.start_time || "09:00", end_time: existing?.end_time || "17:00", enabled: Boolean(existing) };
      }));
      setScheduleLoading(false);
    });
    return () => { current = false; };
  }, [selectedVenueId, supabase, venues]);

  /**
   * Toggles a day's availability on/off.
   */
  const toggleDay = (dayValue: number) => {
    setAvailability(prev => prev.map(a => 
      a.day_of_week === dayValue 
        ? { ...a, enabled: !a.enabled }
        : a
    ));
    setSaved(false);
  };

  /**
   * Updates time for a specific day.
   */
  const updateTime = (dayValue: number, field: "start_time" | "end_time", value: string) => {
    setAvailability(prev => prev.map(a => 
      a.day_of_week === dayValue 
        ? { ...a, [field]: value }
        : a
    ));
    setSaved(false);
  };

  /**
   * Saves availability to database.
   */
  const handleSave = async () => {
    if (!selectedVenueId || scheduleLoading || scheduleFailed || saving) return;
    const enabledDays = availability.filter(day => day.enabled);
    if (!timezone || enabledDays.some(day => day.end_time <= day.start_time)) {
      setError("Choose a timezone and make each end time later than its start time."); return;
    }
    setSaving(true); setSaved(false); setError(null);
    const { error } = await supabase.rpc("save_provider_schedule", {
      venue: selectedVenueId, timezone_name: timezone,
      days: enabledDays.map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time })),
    });
    if (error) setError(bookingError(error, "Your schedule was not changed. Check the times and try again."));
    else {
      setSaved(true);
      setVenues(current => current.map(venue => venue.id === selectedVenueId ? { ...venue, timezone } : venue));

    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && venues.length === 0) return <div className="p-6"><p role="alert" className="text-red-700 mb-4">{error}</p><Button onClick={() => window.location.reload()}>Retry</Button></div>;

  if (venues.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No venues yet</h3>
          <p className="text-muted-foreground mb-6">
            Create a venue first to set your availability.
          </p>
          <Button asChild>
            <Link href="/provider/venues/new">Create Your First Venue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Availability</h1>
        <p className="text-muted-foreground">
          Set your weekly schedule for accepting bookings
        </p>
      </div>

      <div className="max-w-2xl">
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-4 rounded-xl mb-4">{error} {scheduleFailed && <button className="underline" onClick={() => window.location.reload()}>Reload schedule</button>}</p>}
        {scheduleLoading && <p role="status" className="text-sm text-muted-foreground mb-4">Loading schedule…</p>}
        {/* Venue Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Select Venue
          </label>
          <select
            disabled={saving}
            value={selectedVenueId}
            onChange={(e) => { setSelectedVenueId(e.target.value); setSaved(false); }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {venues.map(venue => (
              <option key={venue.id} value={venue.id}>{venue.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <label htmlFor="provider-timezone" className="text-sm font-medium block mb-2">Provider timezone</label>
          <input id="provider-timezone" list="timezone-options" value={timezone} disabled={saving || scheduleLoading || scheduleFailed} onChange={event => { setTimezone(event.target.value); setSaved(false); }} className="w-full border rounded-lg px-3 py-2" />
          <datalist id="timezone-options">{["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Pacific/Honolulu", "Europe/London", "UTC"].map(zone => <option key={zone} value={zone} />)}</datalist>
          <p className="text-xs text-muted-foreground mt-2">Confirm the timezone where you provide the service. Your weekly hours and customer appointment times use this zone.</p>
        </div>
        {/* Weekly Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Weekly Schedule</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {DAYS.map((day) => {
              const dayAvail = availability.find(a => a.day_of_week === day.value);
              if (!dayAvail) return null;

              return (
                <div key={day.value} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        role="switch" aria-checked={dayAvail.enabled} aria-label={`${day.label} availability`} disabled={saving || scheduleLoading || scheduleFailed}
                        onClick={() => toggleDay(day.value)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          dayAvail.enabled ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            dayAvail.enabled ? "left-5" : "left-1"
                          }`}
                        />
                      </button>
                      
                      {/* Day name */}
                      <span className={`font-medium ${dayAvail.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                        {day.label}
                      </span>
                    </div>

                    {/* Time inputs */}
                    {dayAvail.enabled && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <input
                            type="time"
                            aria-label={`${day.label} start time`} disabled={saving || scheduleLoading || scheduleFailed}
                            value={dayAvail.start_time}
                            onChange={(e) => updateTime(day.value, "start_time", e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        <span className="text-muted-foreground">to</span>
                        <input
                          type="time"
                          aria-label={`${day.label} end time`} disabled={saving || scheduleLoading || scheduleFailed}
                          value={dayAvail.end_time}
                          onChange={(e) => updateTime(day.value, "end_time", e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    )}

                    {!dayAvail.enabled && (
                      <span className="text-sm text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving || scheduleLoading || scheduleFailed}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : null}
            {saved ? "Saved!" : "Save Availability"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Existing appointments keep their reserved times.
          </p>
        </div>
      </div>
    </div>
  );
}

