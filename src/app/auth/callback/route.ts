import { createRouteHandlerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/booking";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeReturnPath(url.searchParams.get("next"));
  if (code) {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) return NextResponse.redirect(new URL(next, url.origin));
  }
  const failure = new URL("/auth/signin", url.origin);
  failure.searchParams.set("error", "Sign-in could not be completed. Please try again.");
  failure.searchParams.set("next", next);
  return NextResponse.redirect(failure);
}
