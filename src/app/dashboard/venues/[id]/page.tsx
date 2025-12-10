import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Star, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function VenuePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Fetch venue details with services
  const { data: venue, error } = await supabase
    .from("venues")
    .select(`
      *,
      services (*),
      users (
        name,
        avatar_url
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !venue) {
      return <div className="text-white p-10">Venue not found.</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white selection:bg-white/20">
      <Navbar />
      
      <main className="flex-1 pb-24">
        {/* Header Image */}
        <div className="h-[40vh] relative bg-[#1a1a1a]">
            {venue.image_url ? (
                <Image 
                    src={venue.image_url} 
                    alt={venue.name} 
                    fill 
                    className="object-cover opacity-80"
                />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
        </div>

        <div className="container px-4 md:px-6 -mt-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Column: Info & Services */}
                <div className="flex-1">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">{venue.name}</h1>
                        <div className="flex items-center gap-4 text-white/60 text-sm mb-4">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {venue.campus}
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                4.9 (120 reviews)
                            </div>
                        </div>
                        <p className="text-white/80 leading-relaxed max-w-2xl">
                            {venue.description}
                        </p>
                    </div>

                    <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-semibold">Services</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {venue.services?.map((service: any) => (
                                <div key={service.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                                    <div>
                                        <h3 className="font-medium text-lg mb-1">{service.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-white/50">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {service.duration} mins
                                            </span>
                                            <span className="text-white/20">•</span>
                                            <span>{service.description}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-semibold">
                                            ${service.price}
                                        </div>
                                        <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Book
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sticky Sidebar */}
                <div className="w-full md:w-96 flex-shrink-0">
                    <div className="sticky top-24 space-y-6">
                         {/* Provider Profile Card */}
                        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5">
                            <h3 className="font-semibold mb-4 text-white/50 text-sm uppercase tracking-wider">Provider</h3>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-white/10 overflow-hidden relative">
                                     {venue.users?.avatar_url ? (
                                         <Image 
                                            src={venue.users.avatar_url} 
                                            alt={venue.users.name || "Provider"} 
                                            fill 
                                            className="object-cover" 
                                         />
                                     ) : (
                                         <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-lg">
                                            {venue.users?.name?.[0] || "P"}
                                         </div>
                                     )}
                                </div>
                                <div>
                                    <div className="font-medium">{venue.users?.name}</div>
                                    <div className="text-sm text-white/50">Joined 2024</div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 flex gap-2">
                                <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                                    Contact
                                </Button>
                                <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                                    Share
                                </Button>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 text-sm space-y-4">
                            <div className="flex justify-between">
                                <span className="text-white/50">Opening Hours</span>
                                <span>09:00 - 18:00</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-white/50">Location</span>
                                <span>Dorm A, Room 204</span>
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

