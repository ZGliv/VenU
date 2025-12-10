"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { Search, MapPin, ArrowRight, Star, ChevronDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [campus, setCampus] = useState("State University");
  const [featuredVenues, setFeaturedVenues] = useState<any[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVenues() {
      setLoading(true);
      const { data: featured } = await supabase
        .from("venues")
        .select("*")
        .eq("campus", campus)
        .limit(12);
      
      const { data: trending } = await supabase
        .from("venues")
        .select("*")
        .eq("campus", campus)
        .limit(6);
      
      if (featured) setFeaturedVenues(featured);
      if (trending) setTrendingVenues(trending);
      setLoading(false);
    }
    fetchVenues();
  }, [campus, supabase]);

  const campuses = ["State University", "Ivy College", "Tech Institute"];

  const topCategories = [
    { name: 'Beauty', category: 'Beauty', img: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&q=60&w=400' },
    { name: 'Academic', category: 'Academic', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=60&w=400' },
    { name: 'Food', category: 'Food', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=60&w=400' },
    { name: 'Tech', category: 'Tech', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=60&w=400' },
    { name: 'Fitness', category: 'Fitness', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=60&w=400' },
    { name: 'Music', category: 'Music', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=60&w=400' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white selection:bg-white/20">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section with Side-by-Side Layout */}
        <section className="relative py-20 lg:py-24 overflow-hidden bg-[#1a1a1a]">
          <div className="max-w-[95%] mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              {/* Left Side - Hero Search Area */}
              <div className="lg:col-span-2">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-200 to-blue-200 border border-white/20 p-8 lg:p-12 min-h-[400px] lg:min-h-[500px] flex flex-col justify-between">
                  <div>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 text-gray-900">
                      <span className="text-sky-600">Come, See, Book.</span> <br/> <span className="text-gray-700">Veni, Vidi, VenU</span>
                    </h1>
                    
                    {/* Search Bar */}
                    <div className="w-full flex items-center space-x-2 p-3 bg-white/60 border border-gray-300 rounded-full mb-4 transition-all hover:border-gray-400 hover:bg-white/80">
                      <div className="pl-4 text-gray-500">
                        <Search className="h-5 w-5" />
                      </div>
                      <Input 
                        type="text" 
                        placeholder="Search"
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-10 text-base text-gray-900 placeholder:text-gray-500"
                      />
                    </div>

                    {/* Location Selector */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 hover:text-gray-900 transition-colors cursor-pointer outline-none">
                            <MapPin className="h-4 w-4" />
                            {campus}
                            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1e1e1e] border-white/10 text-white">
                          {campuses.map((c) => (
                            <DropdownMenuItem 
                              key={c} 
                              onClick={() => setCampus(c)}
                              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              {c}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Category Cards Stacked */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {/* Services Card */}
                <Link href={`/explore?campus=${encodeURIComponent(campus)}`} className="group relative overflow-hidden rounded-3xl bg-[#1e1e1e] border border-white/20 hover:border-white/30 transition-all flex-1 min-h-[240px] block">
                  <div className="absolute inset-0 bg-[#1e1e1e]" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[80%] bg-[#1e1e1e]">
                    <div 
                      className="w-full h-full bg-contain bg-no-repeat opacity-40 group-hover:opacity-50 transition-opacity"
                      style={{
                        backgroundImage: 'url(/assets/services.png)',
                        backgroundPosition: 'right center',
                        backgroundSize: 'contain'
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1e1e1e] via-[#1e1e1e]/85 to-transparent" />
                  <div className="p-6 relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-white">Services</h3>
                      <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                        Browse <ArrowRight className="ml-2 h-4 w-4 inline" />
                      </Button>
                    </div>
                  </div>
                </Link>

                {/* Food & Drinks Card */}
                <Link href={`/explore?category=Food&campus=${encodeURIComponent(campus)}`} className="group relative overflow-hidden rounded-3xl bg-[#1e1e1e] border border-white/20 hover:border-white/30 transition-all flex-1 min-h-[240px] block">
                  <div className="absolute inset-0 bg-[#1e1e1e]" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[80%] bg-[#1e1e1e]">
                    <div 
                      className="w-full h-full bg-contain bg-no-repeat opacity-40 group-hover:opacity-50 transition-opacity"
                      style={{
                        backgroundImage: 'url(/assets/food_and_drinks.png)',
                        backgroundPosition: 'right center',
                        backgroundSize: 'contain'
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1e1e1e] via-[#1e1e1e]/85 to-transparent" />
                  <div className="p-6 relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-white">Food & Drinks</h3>
                      <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 p-0 h-auto font-normal">
                        Browse <ArrowRight className="ml-2 h-4 w-4 inline" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* "You Might Like" Section - Horizontal Scrollable */}
        <section className="py-16">
          <div className="max-w-[95%] mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight">You might like @ {campus}</h2>
              <Link href={`/explore?campus=${encodeURIComponent(campus)}`}>
                <Button variant="link" className="text-white/60 hover:text-white">See all</Button>
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-20 text-white/50">Loading...</div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 scroll-smooth">
                {featuredVenues.length > 0 ? featuredVenues.map((venue) => (
                  <Link key={venue.id} href={`/dashboard/venues/${venue.id}`} className="group cursor-pointer space-y-3 flex-shrink-0 w-64">
                    <div className="aspect-[4/3] rounded-xl bg-[#252525] overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-all">
                      <Image 
                        src={venue.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop&q=60'} 
                        alt={venue.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white text-white" /> 4.9
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight group-hover:text-white/90">{venue.name}</h3>
                      <p className="text-sm text-white/60 line-clamp-2">{venue.description}</p>
                    </div>
                  </Link>
                )) : (
                  <div className="w-full text-center text-white/40 py-10">No providers found for {campus} yet.</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* "Trending near you" Section */}
        <section className="py-16 bg-[#0f0f0f]">
          <div className="max-w-[95%] mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-white/60" />
                <h2 className="text-3xl font-bold tracking-tight">Trending near you</h2>
              </div>
              <Link href={`/explore?campus=${encodeURIComponent(campus)}`}>
                <Button variant="link" className="text-white/60 hover:text-white">See all</Button>
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-20 text-white/50">Loading...</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 scroll-smooth">
                {trendingVenues.length > 0 ? trendingVenues.map((venue) => (
                  <Link key={venue.id} href={`/dashboard/venues/${venue.id}`} className="group cursor-pointer flex-shrink-0 w-48">
                    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/5 group-hover:border-white/20 transition-all p-4">
                      <div className="aspect-square rounded-lg bg-[#252525] overflow-hidden relative mb-3">
                        <Image 
                          src={venue.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop&q=60'} 
                          alt={venue.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="font-semibold text-sm leading-tight group-hover:text-white/90 mb-1 line-clamp-1">{venue.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Star className="h-3 w-3 fill-white/50 text-white/50" /> 4.9
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="w-full text-center text-white/40 py-10">No trending providers found.</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* "Top Categories" Grid Section */}
        <section className="py-16">
          <div className="max-w-[95%] mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Top Categories</h2>
              <Link href={`/explore?campus=${encodeURIComponent(campus)}`}>
                <Button variant="link" className="text-white/60 hover:text-white">See all</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCategories.map((cat) => (
                <Link 
                  key={cat.name} 
                  href={`/explore?campus=${encodeURIComponent(campus)}&category=${cat.category}`}
                  className="group relative overflow-hidden rounded-2xl bg-[#1e1e1e] border border-white/5 hover:border-white/10 transition-all aspect-[3/2] block"
                >
                  <Image 
                    src={cat.img} 
                    alt={cat.name}
                    fill
                    className="object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold drop-shadow-lg">{cat.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Service Categories Scroll */}
        <section className="py-12 pb-24">
          <div className="max-w-[95%] mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Service Categories</h2>
              <Link href={`/explore?campus=${encodeURIComponent(campus)}`}>
                <Button variant="link" className="text-white/60 hover:text-white">See all</Button>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 scroll-smooth">
              {[
                { name: 'Beauty', category: 'Beauty', img: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&q=60&w=200' },
                { name: 'Academic', category: 'Academic', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=60&w=200' },
                { name: 'Photography', category: 'Photography', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=60&w=200' },
                { name: 'Events', category: 'Events', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=60&w=200' },
                { name: 'Fitness', category: 'Fitness', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=60&w=200' },
                { name: 'Music', category: 'Music', img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=60&w=200' },
                { name: 'Food', category: 'Food', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=60&w=200' },
                { name: 'Tech', category: 'Tech', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=60&w=200' },
                { name: 'Professional', category: 'Professional', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=60&w=200' },
                { name: 'Sports', category: 'Sports', img: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=60&w=200' }
              ].map((cat) => (
                <Link 
                  key={cat.name} 
                  href={`/explore?campus=${encodeURIComponent(campus)}&category=${cat.category}`}
                  className="flex-shrink-0 flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full bg-[#252525] border border-white/5 group-hover:border-white/20 transition-all overflow-hidden relative">
                    <Image 
                      src={cat.img} 
                      alt={cat.name}
                      fill
                      className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                    />
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="py-12 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-[95%] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">VenU</span>
          </div>
          <p className="text-sm text-white/40">
            © 2024 VenU Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
