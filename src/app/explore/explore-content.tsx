/**
 * explore-content.tsx
 * 
 * Client component for the explore page.
 * Displays filterable grid of venues/providers with category pills and search.
 * Fetches data from Supabase and supports filtering by category.
 * 
 * Features:
 * - Category filter pills
 * - Search input (UI ready, search logic can be added)
 * - Responsive grid of venue cards
 * - Loading states and empty states
 */

"use client";

import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, MapPin, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

// Venue type for TypeScript
interface Venue {
  id: string;
  name: string;
  description: string;
  campus: string;
  category: string;
  image_url: string | null;
  services: { price: number }[];
}

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const campus = searchParams.get("campus") || "State University";
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "All");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  // Fetch all categories for the campus
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("venues")
        .select("category")
        .eq("campus", campus)
        .not("category", "is", null);

      if (data) {
        const uniqueCategories = Array.from(new Set(data.map(v => v.category).filter(Boolean)));
        setCategories(["All", ...uniqueCategories.sort()]);
      }
    }
    fetchCategories();
  }, [campus, supabase]);

  // Fetch venues when campus or category changes
  useEffect(() => {
    async function fetchVenues() {
      setLoading(true);
      let query = supabase
        .from("venues")
        .select(`
          *,
          services (
            price
          )
        `)
        .eq("campus", campus);

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching venues:", error);
      } else {
        setVenues(data || []);
      }
      setLoading(false);
    }

    fetchVenues();
  }, [campus, selectedCategory, supabase]);

  // Filter venues by search query
  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get the minimum price from a venue's services
  const getMinPrice = (services: { price: number }[]) => {
    if (!services || services.length === 0) return 0;
    return Math.min(...services.map(s => s.price));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 mesh-gradient" />
      
      {/* Floating decorative blobs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-violet-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <Navbar />
      
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to home
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-1">Explore Services</h1>
            <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {campus}
             </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search providers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-gray-200 focus-visible:ring-primary/20"
                />
             </div>
            <Button variant="outline" className="border-gray-200 bg-white hover:bg-gray-50">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
             </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
             {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-violet-500/25" 
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {cat}
                </button>
             ))}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-6">
          {loading ? "Loading..." : `${filteredVenues.length} provider${filteredVenues.length !== 1 ? "s" : ""} found`}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-xl bg-gray-200 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full mb-4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredVenues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVenues.map((venue) => (
                <Link href={`/dashboard/venues/${venue.id}`} key={venue.id} className="group block">
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 transition-all hover:border-gray-200 hover:shadow-lg hover:-translate-y-1 duration-300">
                      {/* Image */}
                  <div className="aspect-[4/3] relative bg-gray-100">
                          <Image 
                      src={venue.image_url || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop&q=60"} 
                            alt={venue.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-sm font-medium shadow-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      4.9
                    </div>
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground/80 shadow-sm">
                      {venue.category}
                          </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                      {venue.description}
                    </p>
                         
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-xs text-muted-foreground">
                        {venue.services?.length || 0} services
                            </div>
                      <div className="text-sm font-semibold text-foreground">
                        From ${getMinPrice(venue.services)}
                            </div>
                         </div>
                      </div>
                   </div>
                </Link>
              ))}
            </div>
        ) : (
          <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery 
                  ? "No results found" 
                  : selectedCategory !== "All" 
                    ? `No ${selectedCategory} providers found` 
                    : "No providers found yet"
                }
                    </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? `Try a different search term or browse by category.`
                  : selectedCategory !== "All" 
                        ? `Try selecting a different category or check back later.`
                    : `Be the first to add a provider at ${campus}!`
                }
                    </p>
              {(selectedCategory !== "All" || searchQuery) && (
                      <Button 
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                        variant="outline"
                  className="border-gray-200"
                      >
                  Clear Filters
                      </Button>
                    )}
                  </div>
               </div>
            )}
      </div>
    </div>
  );
}
