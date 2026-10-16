/**
 * page.tsx
 * 
 * Landing page for VenU application.
 * Premium, cutting-edge design with modern UI patterns.
 * 
 * Features:
 * - Bento grid hero section with dynamic content cards
 * - Animated gradient text and glassmorphic elements
 * - Interactive category exploration
 * - Featured providers with hover effects
 * - Social proof and trust indicators
 * - Responsive design with smooth animations
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Star, 
  ChevronDown, 
  Sparkles,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

// Venue type definition for TypeScript
interface Venue {
  id: string;
  name: string;
  description: string;
  campus: string;
  category: string;
  image_url: string | null;
}

export default function LandingPage() {
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const [campus, setCampus] = useState("All campuses");
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    supabase.from("venues").select("id,name,description,campus,category,image_url").eq("status", "approved").order("name").then(({ data, error }) => {
      if (!current) return;
      if (error) setError("Providers are unavailable right now. Please try Explore again shortly.");
      else setAllVenues(data || []);
      setLoading(false);
    });
    return () => { current = false; };
  }, [supabase]);
  const campusVenues = campus === "All campuses" ? allVenues : allVenues.filter(venue => venue.campus === campus);
  const featuredVenues = campusVenues.slice(0, 8);
  const campusData = ["All campuses", ...Array.from(new Set(allVenues.map(venue => venue.campus))).sort()].map(name => ({
    name, abbr: name === "All campuses" ? "VU" : name.split(" ").map(word => word[0]).join("").slice(0, 3),
    location: name === "All campuses" ? "Browse all approved listings" : "Campus services", color: "from-blue-600 to-blue-700",
  }));
  
  // Get current campus data
  const currentCampus = campusData.find(c => c.name === campus) || campusData[0];

  // Category data with refined imagery
  const categories = [
    { 
      name: "Beauty", 
      description: "Haircuts, nails, makeup",
      category: "Beauty", 
      img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600",
      gradient: "from-pink-500/20 to-rose-500/20",
    },
    { 
      name: "Academic", 
      description: "Tutoring & test prep",
      category: "Academic", 
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600",
      gradient: "from-blue-500/20 to-indigo-500/20",
    },
    { 
      name: "Food & Drinks", 
      description: "Cafes & catering",
      category: "Food", 
      img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    { 
      name: "Tech Services", 
      description: "Coding help & repairs",
      category: "Tech", 
      img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
      gradient: "from-cyan-500/20 to-blue-500/20",
    },
    { 
      name: "Fitness", 
      description: "Training & yoga",
      category: "Fitness", 
      img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
    { 
      name: "Photography/Videography", 
      description: "Portraits & events",
      category: "Photography/Videography", 
      img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600",
      gradient: "from-violet-500/20 to-purple-500/20",
    },
  ];

  // Quick search suggestions
  const quickSearches = ["Haircuts", "Tutoring", "Coffee", "Repairs", "Photography/Videography"];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section - Bento Grid Style */}
        <section className="relative pt-8 pb-16 lg:pt-12 lg:pb-24 overflow-hidden">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 -z-10 mesh-gradient" />
          
{/* Floating decorative elements - pointer-events-none so they don't block clicks */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/5 to-pink-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            {/* Bento Grid Layout */}
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-6">
              
              {/* Main Hero Content - Takes 7 columns */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm w-fit mb-6 animate-slide-down">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Campus services, reimagined</span>
                </div>
                
                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1] animate-slide-up">
                  Book services that feel{" "}
                  <span className="gradient-text">native to campus</span>
                </h1>
                
                {/* Subheadline */}
                <p className="text-lg lg:text-xl text-slate-600 max-w-xl mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
                  Discover student entrepreneurs and local providers—haircuts,
                  tutoring, food, tech help, and more—without leaving your routine.
                </p>
                
                {/* Search Bar */}
                <div className="max-w-xl mb-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
                  <form action="/explore" className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-elevation-3 border border-slate-200/50">
                    <input type="hidden" name="campus" value={campus} />
                    <div className="flex-1 flex items-center gap-3 px-4">
                      <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <Input 
                        type="search" name="q" aria-label="Search campus services"
                        placeholder="Search haircuts, tutoring, food, tech..."
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-12 text-base placeholder:text-slate-400"
                      />
                    </div>
                    <Button type="submit"
                      size="lg" 
                      className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all hover:shadow-lg"
                    >
                      Search
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                  
                  {/* Trust Badge - Inline with search */}
                  <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span>Listings reviewed before they appear here</span>
                  </div>
                </div>
                
                {/* Quick Search Tags */}
                <div className="flex flex-wrap items-center gap-2 animate-slide-up" style={{ animationDelay: "300ms" }}>
                  {quickSearches.map((term) => (
                    <Link 
                      key={term}
                      href={`/explore?campus=${encodeURIComponent(campus)}&q=${term}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                    >
                      <Sparkles className="h-3 w-3" />
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Bento Cards - Takes 5 columns */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3 lg:gap-4 mt-8 lg:mt-0">
                
                {/* Campus Selector Card - Spans 2 columns, at top */}
                <div className="col-span-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-elevation-3 shadow-elevation-2 transition-all outline-none group">
                        {/* Campus Logo Placeholder */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentCampus.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <span className="text-white font-bold text-lg">
                            {currentCampus.abbr}
                          </span>
                        </div>
                        
                        {/* Campus Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Browsing at</div>
                          <div className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {campus}
                          </div>
                        </div>
                        
                        {/* Change Button */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
                          <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Change</span>
                          <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[340px] p-3 bg-white border-slate-200 shadow-elevation-4 rounded-2xl">
                      <div className="px-2 py-2 mb-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">Select your campus</p>
                        <p className="text-xs text-slate-500">Choose where you want to browse services</p>
                      </div>
                      {campusData.map((c) => (
                        <DropdownMenuItem 
                          key={c.name} 
                          onClick={() => setCampus(c.name)}
                          className={`cursor-pointer rounded-xl p-3 flex items-center gap-3 mb-1 last:mb-0 ${campus === c.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                          {/* Campus Logo in dropdown */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br ${c.color}`}>
                            <span className="text-white font-bold text-sm">
                              {c.abbr}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm ${campus === c.name ? 'text-blue-700' : 'text-slate-900'}`}>
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              {c.location}
                              <span className="text-slate-300">|</span>
                              <span>Browse listings</span>
                            </div>
                          </div>
                          {campus === c.name && (
                            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Featured Provider Card - Spans 2 columns */}
                <div className="col-span-2 bg-white rounded-2xl p-4 shadow-elevation-2 border border-slate-100 hover:shadow-elevation-3 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Discover providers</h3>
                    </div>
                    <Link 
                      href={`/explore?campus=${encodeURIComponent(campus)}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      Explore
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                  
                  {/* Mini provider list */}
                  <div className="space-y-2">
                    {loading ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-lg bg-slate-100" />
                            <div className="flex-1">
                              <div className="h-3 bg-slate-100 rounded w-3/4 mb-1.5" />
                              <div className="h-2.5 bg-slate-50 rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : featuredVenues.slice(0, 3).map((venue) => (
                      <Link 
                        key={venue.id}
                        href={`/dashboard/venues/${venue.id}`}
                        className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <Image 
                            src={venue.image_url || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200"} 
                            alt={venue.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate text-sm">{venue.name}</h4>
                          <p className="text-xs text-slate-500">{venue.category}</p>
                        </div>

                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Category Quick Access Card */}
                <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-elevation-2 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">Find something new</h3>
                      <p className="text-xs text-slate-300 mt-0.5">Top categories for fast booking</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.slice(0, 4).map((cat) => (
                      <Link
                        key={cat.name}
                        href={`/explore?campus=${encodeURIComponent(campus)}&category=${cat.category}`}
                        className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Stats Cards - Split into 2 columns */}
                <div className="bg-white rounded-xl p-3 shadow-elevation-1 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900">{loading || error ? "—" : campusVenues.length}</div>
                      <div className="text-xs text-slate-500">Providers</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 shadow-elevation-1 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900">{loading || error ? "—" : new Set(campusVenues.map(venue => venue.category)).size}</div>
                      <div className="text-xs text-slate-500">Categories</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

{/* Categories Section */}
        <section className="py-20 relative overflow-hidden bg-white">
          {/* Clean white background with very subtle accents */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-slate-100/50 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-slate-100/50 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
                    <Sparkles className="h-3.5 w-3.5" />
                    Browse by category
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Find what you need</h2>
                  <p className="text-slate-500 mt-2 text-lg">Explore services across all categories</p>
                </div>
                <Link href={`/explore?campus=${encodeURIComponent(campus)}`}>
                  <Button variant="outline" className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700">
                    View all categories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
            
            {/* Categories Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {categories.map((cat, index) => (
                <ScrollReveal key={cat.name} delay={index * 100} duration={500}>
                  <Link 
                    href={`/explore?campus=${encodeURIComponent(campus)}&category=${cat.category}`}
                    className="group relative overflow-hidden rounded-3xl aspect-[4/3] bg-slate-100 block"
                  >
                    {/* Background Image */}
                    <Image 
                      src={cat.img} 
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">{cat.name}</h3>
                      <p className="text-white/70 text-sm lg:text-base">{cat.description}</p>
                    </div>
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Providers Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Mesh gradient background - same style as hero */}
          <div className="absolute inset-0 -z-10 mesh-gradient" />
          
{/* Additional floating blobs for extra depth */}
          <div className="absolute top-20 right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-violet-500/[0.07] rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-medium mb-4">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    Explore providers
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Providers · {campus}</h2>
                  <p className="text-slate-500 mt-2 text-lg">Explore services and request an appointment</p>
                </div>
                <Link href={`/explore?campus=${encodeURIComponent(campus)}`}>
                  <Button variant="outline" className="border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700">
                    See all providers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
            
            {/* Providers Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-2xl bg-slate-200 mb-4" />
                    <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-2" />
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                  </div>
                ))}
              </div>
            ) : featuredVenues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredVenues.slice(0, 8).map((venue, index) => (
                  <ScrollReveal key={venue.id} delay={index * 75} duration={500}>
                    <Link 
                      href={`/dashboard/venues/${venue.id}`} 
                      className="group block"
                    >
                      <div className="aspect-[4/3] rounded-2xl bg-slate-100 overflow-hidden relative mb-4 shadow-elevation-1 group-hover:shadow-elevation-3 transition-all">
                        <Image 
                          src={venue.image_url || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800"} 
                          alt={venue.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Rating Badge */}

                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {venue.name}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                          {venue.category}
                        </p>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-4">{error || `No providers found for ${campus} yet.`}</p>
                <Link href="/become-provider">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                    Become the first provider
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

{/* How it Works Section - Premium Redesign */}
        <section className="py-24 relative overflow-hidden bg-white">
          {/* Clean white background with very subtle accents */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-slate-100/50 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-slate-100/50 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <ScrollReveal>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-6">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Simple 3-step process
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-5">
                  Book in <span className="gradient-text">minutes</span>, not hours
                </h2>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                  No more endless scrolling or phone tag. Find, book, and meet—all in one place.
                </p>
              </div>
            </ScrollReveal>
            
            {/* Steps - Horizontal Cards with Connection */}
            <div className="relative">
              {/* Connection line - hidden on mobile */}
              <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-amber-200 to-emerald-200" />
              
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {/* Step 1 */}
                <ScrollReveal delay={0} duration={500}>
                  <div className="relative group h-full">
                    <div className="bg-white rounded-3xl p-8 shadow-elevation-2 border border-slate-100 hover:shadow-elevation-4 hover:border-slate-200 transition-all duration-300 h-full">
                      {/* Step number badge */}
                      <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30">
                        Step 1
                      </div>
                      
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                        <Search className="h-7 w-7 text-blue-600" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Discover services</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Browse by category, search by keyword, or explore what&apos;s trending at your campus.
                      </p>
                      
                      {/* Mini visual */}
                      <div className="mt-6 flex gap-2">
                        <div className="h-2 w-8 rounded-full bg-blue-200" />
                        <div className="h-2 w-12 rounded-full bg-blue-100" />
                        <div className="h-2 w-6 rounded-full bg-blue-50" />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
                
                {/* Step 2 */}
                <ScrollReveal delay={150} duration={500}>
                  <div className="relative group h-full">
                    <div className="bg-white rounded-3xl p-8 shadow-elevation-2 border border-slate-100 hover:shadow-elevation-4 hover:border-slate-200 transition-all duration-300 h-full">
                      {/* Step number badge */}
                      <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30">
                        Step 2
                      </div>
                      
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                        <Clock className="h-7 w-7 text-amber-600" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-3">Pick your slot</h3>
                      <p className="text-slate-500 leading-relaxed">
                        See real-time availability and choose a time that fits your schedule perfectly.
                      </p>
                      
                      {/* Mini calendar visual */}
                      <div className="mt-6 grid grid-cols-4 gap-1.5">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className={`h-6 rounded ${i === 2 ? 'bg-amber-400' : i === 5 ? 'bg-amber-200' : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
                
                {/* Step 3 */}
                <ScrollReveal delay={300} duration={500}>
                  <div className="relative group h-full">
                    <div className="bg-white rounded-3xl p-8 shadow-elevation-2 border border-slate-100 hover:shadow-elevation-4 hover:border-slate-200 transition-all duration-300 h-full">
                      {/* Step number badge */}
                      <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                        Step 3
                      </div>
                      
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-3">You&apos;re all set</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Get instant confirmation, reminders, and connect directly with your provider.
                      </p>
                      
                      {/* Success visual */}
                      <div className="mt-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-emerald-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
            
            {/* Bottom CTA */}
            <ScrollReveal delay={400} duration={500}>
              <div className="mt-16 text-center">
                <Link href="/explore">
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 shadow-lg shadow-slate-900/20">
                    Start browsing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Mesh gradient background - same style as hero */}
          <div className="absolute inset-0 -z-10 mesh-gradient" />
          
{/* Additional floating blobs for extra depth */}
          <div className="absolute top-10 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-500/[0.07] rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 md:p-16 lg:p-20">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
              
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              
              <ScrollReveal direction="left" duration={600}>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      For providers
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                      Ready to grow your business?
                    </h2>
                    <p className="text-slate-300 text-lg">
                      Join VenU as a provider and reach thousands of students. 
                      Set your own schedule, manage bookings, and build your reputation.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/become-provider">
                      <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold w-full sm:w-auto shadow-lg">
                        Get started free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/explore">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="bg-transparent border-2 border-white/80 text-white hover:bg-white/10 hover:border-white font-semibold w-full sm:w-auto backdrop-blur-sm"
                      >
                        Learn more
                      </Button>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-bold text-2xl text-slate-900">VenU</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">Campus marketplace</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link href="/explore" className="text-slate-500 hover:text-slate-900 transition-colors">
                Explore
              </Link>
              <Link href="/become-provider" className="text-slate-500 hover:text-slate-900 transition-colors">
                For Providers
              </Link>
              <Link href="/auth/signin" className="text-slate-500 hover:text-slate-900 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
            2024 VenU Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
