/**
 * [id]/page.tsx
 * 
 * Venue detail page displaying a single venue's information and services.
 * Server component that fetches venue data including services and owner info.
 * 
 * Features:
 * - Hero image with venue details
 * - Services list with pricing
 * - Provider information card
 * - Quick info sidebar
 * - Book buttons for services
 * - Dynamic back navigation (admin venues vs explore based on ?from=admin param)
 */

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, MapPin, Star, ArrowLeft, Share2, Heart, MessageCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Service type for TypeScript
interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

// Venue owner type
interface VenueOwner {
  name: string | null;
  avatar_url: string | null;
}

// Venue type including relations
interface Venue {
  id: string;
  name: string;
  description: string;
  campus: string;
  category: string;
  image_url: string | null;
  status: string;
  admin_message: string | null;
  status_updated_at: string | null;
  provider_name: string | null;
  provider_email: string | null;
  provider_phone: string | null;
  services: Service[];
  users: VenueOwner;
}

export default async function VenuePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string };
  searchParams: { from?: string };
}) {
  // Determine if user came from admin venue management
  const isFromAdmin = searchParams.from === "admin";
  const supabase = createClient();
  
  // Fetch venue details with services and owner info
  // Use explicit relationship name because venues has two FKs to users (owner_id and status_updated_by)
  const { data: venue, error } = await supabase
    .from("venues")
    .select(`
      *,
      services (*),
      users!venues_owner_id_fkey (
        name,
        avatar_url
      )
    `)
    .eq("id", params.id)
    .single();

  // Handle connection errors separately from not found
  if (error) {
    // PGRST116 means no rows returned (venue doesn't exist)
    if (error.code === "PGRST116") {
      notFound();
    }
    // For other errors (connection issues, timeouts), log and show not found
    console.error("Error fetching venue:", error);
    notFound();
  }

  // Show 404 if venue data is null
  if (!venue) {
    notFound();
  }

  // Type cast the venue data
  const typedVenue = venue as Venue;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] relative">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 mesh-gradient" />
      
      {/* Floating decorative blobs */}
      <div className="fixed top-40 left-10 w-72 h-72 bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-violet-500/[0.05] rounded-full blur-3xl pointer-events-none" />
      
      <main className="flex-1 relative z-10">
        {/* Back navigation - goes to admin venues if came from there, otherwise explore */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
          <Link 
            href={isFromAdmin ? "/admin/venues" : "/explore"} 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isFromAdmin ? "Back to venue management" : "Back to explore"}
          </Link>
        </div>

        {/* Hero Image */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-gray-100">
            {typedVenue.image_url ? (
                <Image 
                src={typedVenue.image_url} 
                alt={typedVenue.name} 
                    fill 
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Category badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium">
              {typedVenue.category}
        </div>

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white">
                <Heart className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Venue title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{typedVenue.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                  {typedVenue.campus}
                            </div>
                            <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                4.9 (120 reviews)
                            </div>
                        </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Info & Services */}
            <div className="flex-1">
              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {typedVenue.description}
                </p>
              </div>

              {/* Admin Message - only visible when coming from admin venue management */}
              {isFromAdmin && typedVenue.admin_message && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">Admin Message</h3>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{typedVenue.admin_message}</p>
                      {typedVenue.status_updated_at && (
                        <p className="text-xs text-blue-600 mt-2">
                          Updated: {new Date(typedVenue.status_updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Services */}
                                    <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {typedVenue.services?.length > 0 ? (
                    typedVenue.services.map((service) => (
                      <div 
                        key={service.id} 
                        className="p-4 md:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground mb-1">{service.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> 
                              {service.duration} mins
                                            </span>
                            {service.description && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="truncate">{service.description}</span>
                              </>
                            )}
                                        </div>
                                    </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-lg font-semibold text-foreground">
                                            ${service.price}
                                        </div>
                                <Link href={`/book/${typedVenue.id}/${service.id}`}>
                                  <Button 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                                  >
                                            Book
                                        </Button>
                                </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No services available yet.
                    </div>
                  )}
                </div>
                    </div>
                </div>

            {/* Right Column: Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* Provider Card */}
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Provider
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden relative flex-shrink-0">
                      {typedVenue.users?.avatar_url ? (
                                         <Image 
                          src={typedVenue.users.avatar_url} 
                          alt={typedVenue.users.name || "Provider"} 
                                            fill 
                                            className="object-cover" 
                                         />
                                     ) : (
                                         <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-lg">
                          {typedVenue.users?.name?.[0]?.toUpperCase() || "P"}
                                         </div>
                                     )}
                                </div>
                                <div>
                      <div className="font-medium text-foreground">{typedVenue.users?.name || "Provider"}</div>
                      <div className="text-sm text-muted-foreground">Joined 2024</div>
                                </div>
                            </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 border-gray-200">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact Provider</DialogTitle>
                          <DialogDescription>
                            Get in touch with {typedVenue.provider_name || typedVenue.users?.name || "the provider"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {typedVenue.provider_name && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                              <p className="text-foreground">{typedVenue.provider_name}</p>
                            </div>
                          )}
                          {typedVenue.provider_email && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                              <div className="flex items-center gap-2">
                                <p className="text-foreground">{typedVenue.provider_email}</p>
                                <a
                                  href={`mailto:${typedVenue.provider_email}`}
                                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                  <Mail className="h-4 w-4" />
                                  Send Email
                                </a>
                              </div>
                            </div>
                          )}
                          {typedVenue.provider_phone && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                              <div className="flex items-center gap-2">
                                <p className="text-foreground">{typedVenue.provider_phone}</p>
                                <a
                                  href={`tel:${typedVenue.provider_phone.replace(/[^\d+]/g, '')}`}
                                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                  <Phone className="h-4 w-4" />
                                  Call
                                </a>
                              </div>
                            </div>
                          )}
                          {!typedVenue.provider_email && !typedVenue.provider_phone && (
                            <p className="text-sm text-muted-foreground">
                              Contact information not available for this provider.
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                        </div>

                        {/* Quick Info */}
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Quick Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours</span>
                      <span className="font-medium text-foreground">09:00 - 18:00</span>
                    </div>
                            <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{typedVenue.campus}</span>
                            </div>
                             <div className="flex justify-between">
                      <span className="text-muted-foreground">Services</span>
                      <span className="font-medium text-foreground">{typedVenue.services?.length || 0} available</span>
                            </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 text-white">
                  {/* Decorative gradient orbs */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
                  
                  <div className="relative z-10">
                    <h3 className="font-semibold mb-2">Ready to book?</h3>
                    <p className="text-sm text-slate-300 mb-4">
                      Select a service above to check availability and book your appointment.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-0">
                      View All Services
                    </Button>
                  </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
