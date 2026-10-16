import { redirect } from "next/navigation";

// Legacy links now enter the service-first booking flow. No payment is collected.
export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ venue_id?: string }> }) {
  const venue = (await searchParams).venue_id;
  redirect(venue && /^[0-9a-f-]{36}$/i.test(venue) ? `/dashboard/venues/${venue}` : "/explore");
}
