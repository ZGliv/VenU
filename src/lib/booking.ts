export interface BookingError { code?: string; message?: string }
export function bookingError(error: BookingError | null, fallback = "We couldn’t save this change. Please try again.") {
  if (error?.code === "23P01") return "That time was just taken. Choose another available appointment.";
  if (error?.code === "40001") return "This booking changed. Refresh the list before trying again.";
  if (error?.code === "42501") return "Your account cannot make this change. Check that you’re signed in with an active account.";
  if (error?.code === "22023") return error.message || fallback;
  return fallback;
}
export function dateInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function safeReturnPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";
}
