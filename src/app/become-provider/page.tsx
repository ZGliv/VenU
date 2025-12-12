/**
 * become-provider/page.tsx
 * 
 * Provider onboarding page.
 * Helps new providers get started by upgrading their account and creating first venue.
 * This page is NOT protected by RouteGuard so students can access it.
 * 
 * Features:
 * - Upgrade account to provider role
 * - Create first venue
 * - Getting started guide
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Store, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Loader2
} from "lucide-react";

export default function BecomeProviderPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upgrades user to provider role.
   */
  const handleUpgrade = async () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    setUpgrading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "venue_owner" })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating role:", updateError.message);
      setError(updateError.message);
      setUpgrading(false);
      return;
    }

    await refreshProfile();
    router.push("/provider/venues/new");
  };

  // If already a provider, show redirect option
  if (profile?.role === "venue_owner") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">You're Already a Provider!</h1>
          <p className="text-muted-foreground mb-6">
            You can access your provider dashboard to manage venues and bookings.
          </p>
          <Link href="/provider">
            <Button>Go to Provider Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If admin, show message
  if (profile?.role === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="h-16 w-16 text-violet-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">You're an Admin!</h1>
          <p className="text-muted-foreground mb-6">
            As an admin, you have access to both the admin dashboard and can create venues.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/admin">
              <Button>Admin Dashboard</Button>
            </Link>
            <Link href="/provider/venues/new">
              <Button variant="outline">Create Venue</Button>
            </Link>
          </div>
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
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-violet-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Become a VenU Provider
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our community of student entrepreneurs. Offer your services, 
            manage bookings, and grow your business on campus.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Store className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Create Your Venue</h3>
            <p className="text-sm text-muted-foreground">
              Set up your profile, list your services, and showcase your work to students.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Manage Your Schedule</h3>
            <p className="text-sm text-muted-foreground">
              Set your availability, accept bookings, and organize your appointments easily.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Grow Your Business</h3>
            <p className="text-sm text-muted-foreground">
              Reach more customers, build your reputation, and increase your earnings.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl" />
          
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }} />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Upgrade your account to a provider account and create your first venue. 
              It only takes a few minutes.
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-200 text-sm max-w-md mx-auto">
                {error}
              </div>
            )}

            {user ? (
              <Button 
                size="lg"
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-violet-500/25"
              >
                {upgrading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Become a Provider
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Link href="/auth/signin">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-violet-500/25">
                  Sign In to Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}

            <p className="text-sm text-slate-400 mt-4">
              Free to join. No hidden fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

