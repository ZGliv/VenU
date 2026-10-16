"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { bookingError, dateInZone, shiftDay } from "@/lib/booking";
import { ArrowLeft, Clock, MapPin, CheckCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface Service { id: string; name: string; duration: number; price: number; venue_id: string }
interface Venue { id: string; name: string; campus: string; timezone: string | null }
interface Slot { start_time: string; end_time: string; available: boolean }
interface Receipt { id: string; start_time: string; end_time: string; total_price: number; status: string }

export default function BookingPage() {
  const { venueId, serviceId } = useParams<{ venueId: string; serviceId: string }>();
  const { user, profile, loading: authLoading, profileError, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [service, setService] = useState<Service | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [day, setDay] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true); setError(null);
    Promise.all([
      supabase.from("services").select("id,name,duration,price,venue_id").eq("id", serviceId).eq("venue_id", venueId).single(),
      supabase.from("venues").select("id,name,campus,timezone").eq("id", venueId).eq("status", "approved").single(),
    ]).then(([serviceResult, venueResult]) => {
      if (!current) return;
      if (serviceResult.error || venueResult.error) { setError("We couldn’t load this service. It may be unavailable, or the connection needs another try."); return; }
      setService(serviceResult.data); setVenue(venueResult.data);
      setDay(dateInZone(new Date(), venueResult.data.timezone || "UTC"));
    }).catch(() => { if (current) setError("We couldn’t connect. Please try again."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [serviceId, venueId, supabase]);

  useEffect(() => {
    if (!day || !user || !profile || receipt) return;
    let current = true;
    setSelected(null); setSlots([]); setSlotsLoading(true); setSlotError(null);
    supabase.rpc("list_booking_slots", { service: serviceId, booking_day: day }).then(({ data, error: requestError }) => {
      if (!current) return;
      if (requestError) setSlotError(bookingError(requestError, "We couldn’t load appointment times. Please retry."));
      else setSlots((data || []) as Slot[]);
      setSlotsLoading(false);
    });
    return () => { current = false; };
  }, [day, serviceId, user, profile, receipt, reload, supabase]);

  const zone = venue?.timezone || "UTC";
  const today = dateInZone(new Date(), zone);
  const time = (value: string) => new Date(value).toLocaleTimeString("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const date = (value: string) => new Date(value).toLocaleDateString("en-US", { timeZone: zone, weekday: "long", month: "long", day: "numeric" });
  async function requestBooking() {
    if (!selected || !user || !service || saving) return;
    setSaving(true); setError(null);
    const { data, error: requestError } = await supabase.from("bookings").insert({
      user_id: user.id, service_id: service.id, start_time: selected.start_time,
      // PostgreSQL always replaces the submitted duration and price.
      end_time: selected.end_time, total_price: service.price, status: "pending",
    }).select("id,start_time,end_time,total_price,status").single();
    if (requestError || !data) {
      setError(bookingError(requestError));
      setReload(value => value + 1);
    } else setReceipt(data as Receipt);
    setSaving(false);
  }

  return <div className="min-h-screen bg-[#FAFAFA]">
    <Navbar />
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href={`/dashboard/venues/${venueId}`} className="inline-flex items-center text-sm text-muted-foreground mb-6"><ArrowLeft className="h-4 w-4 mr-1" />Back to provider</Link>
      {loading || authLoading ? <div className="py-20 flex justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin" /><span className="sr-only">Loading booking</span></div>
        : receipt && service && venue ? <section className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
          <CheckCircle className="h-10 w-10 text-emerald-600 mb-5" />
          <p className="text-sm font-medium text-amber-700 mb-2">Pending provider response</p>
          <h1 className="text-3xl font-bold mb-3">Request received</h1>
          <p className="text-muted-foreground mb-6">Your time is reserved while the provider reviews it. Check My Bookings for confirmation or a decline.</p>
          <dl className="space-y-4 text-sm">
            <div><dt className="text-muted-foreground">Appointment</dt><dd className="font-medium">{service.name} at {venue.name}</dd></div>
            <div><dt className="text-muted-foreground">When</dt><dd>{date(receipt.start_time)} · {time(receipt.start_time)}–{time(receipt.end_time)}</dd></div>
            <div><dt className="text-muted-foreground">Service price</dt><dd>${Number(receipt.total_price).toFixed(2)} · Pay the provider directly</dd></div>
            <div><dt className="text-muted-foreground">Reference</dt><dd className="break-all">{receipt.id}</dd></div>
          </dl>
          <Button asChild className="mt-8 w-full"><Link href="/dashboard/bookings">View My Bookings</Link></Button>
        </section>
        : !service || !venue ? <section className="max-w-xl mx-auto py-12"><h1 className="text-2xl font-bold mb-3">Service unavailable</h1><p role="alert" className="text-muted-foreground mb-6">{error}</p><Button onClick={() => window.location.reload()}>Try again</Button><Button variant="link" asChild><Link href="/explore">Browse services</Link></Button></section>
        : !user || !profile ? <section className="max-w-xl mx-auto py-12"><h1 className="text-2xl font-bold mb-3">Sign in to request a time</h1><p className="text-muted-foreground mb-6">{profileError || "Your provider will see your name and email when you request an appointment."}</p>{user ? <Button onClick={refreshProfile}>Retry account</Button> : <Button asChild><Link href={`/auth/signin?next=${encodeURIComponent(`/book/${venueId}/${serviceId}`)}`}>Sign in</Link></Button>}</section>
        : <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div><h1 className="text-3xl font-bold mb-2">Request an appointment</h1><p className="text-muted-foreground">Pick a time. Your provider will confirm the details.</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <label htmlFor="booking-day" className="block text-sm font-semibold mb-3">Appointment date</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Previous day" disabled={day <= today || saving} onClick={() => setDay(shiftDay(day, -1))}><ChevronLeft className="h-4 w-4" /></Button>
                <input id="booking-day" type="date" min={today} max={shiftDay(today, 30)} value={day} disabled={saving} onChange={event => event.target.value && setDay(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 bg-white text-sm" />
                <Button variant="outline" size="icon" aria-label="Next day" disabled={day >= shiftDay(today, 30) || saving} onClick={() => setDay(shiftDay(day, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 break-words">All times use the provider’s timezone: {venue.timezone || "not configured"}.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-semibold">Available times</h2><Button variant="ghost" size="sm" disabled={slotsLoading || saving} onClick={() => setReload(value => value + 1)}>Refresh</Button></div>
              {slotsLoading ? <p role="status" className="py-6 text-sm text-muted-foreground">Checking availability…</p> : slotError ? <p role="alert" className="text-sm text-red-700">{slotError}</p> : slots.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{slots.map(slot => <Button key={slot.start_time} variant={selected?.start_time === slot.start_time ? "default" : "outline"} disabled={!slot.available || saving} aria-pressed={selected?.start_time === slot.start_time} onClick={() => setSelected(slot)} className="h-auto min-h-11 whitespace-normal text-xs">{time(slot.start_time)}{!slot.available && <span className="sr-only"> unavailable</span>}</Button>)}</div> : <p className="text-sm text-muted-foreground py-6">No appointments on this day. Try another date.</p>}
            </div>
          </section>
          <aside className="bg-white rounded-xl border border-gray-200 p-5 self-start lg:sticky lg:top-24">
            <p className="text-sm text-muted-foreground mb-1">{venue.name}</p><h2 className="text-xl font-semibold mb-3">{service.name}</h2>
            <p className="flex gap-2 text-sm text-muted-foreground mb-2"><MapPin className="h-4 w-4 shrink-0" />{venue.campus}</p><p className="flex gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{service.duration} minutes</p>
            {selected && <p className="text-sm mt-5">{date(selected.start_time)}<br />{time(selected.start_time)}–{time(selected.end_time)}</p>}
            <p className="font-semibold text-xl border-t mt-5 pt-5">${Number(service.price).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2 mb-5">Pay the provider directly. VenU does not collect payment.</p>
            {error && <p role="alert" className="text-sm text-red-700 mb-4">{error}</p>}
            <Button className="w-full" onClick={requestBooking} disabled={!selected || saving || slotsLoading}>{saving ? "Sending request…" : "Request appointment"}</Button>
          </aside>
        </div>}
    </main>
  </div>;
}
