/**
 * explore-content.tsx
 * 
 * Client component for the explore page.
 * Displays filterable grid of venues/providers with category pills and search.
 * Fetches data from Supabase and supports filtering by category.
 * 
 * Features:
 * - Category filter pills
 * - Search input with real-time filtering
 * - Responsive grid of venue cards with favorite functionality
 * - Loading states and empty states
 * 
 * Functions:
 * - ExploreContent: Main component that renders the explore page
 * - fetchCategories: Retrieves unique categories from venues
 * - fetchVenues: Retrieves venues based on campus and category filters
 */

"use client";

import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { VenueCard } from "./venue-card";

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
  const campus = searchParams.get("campus") || "All campuses";
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "All");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  // Fetch all categories for the campus
  useEffect(() => {
    async function fetchCategories() {
      let query = supabase
        .from("venues")
        .select("category")
        .eq("status", "approved")
        .not("category", "is", null);
      if (campus !== "All campuses") query = query.eq("campus", campus);
      const { data } = await query;

      if (data) {
        const uniqueCategories = Array.from(new Set(data.map(v => v.category).filter(Boolean)));
        setCategories(["All", ...uniqueCategories.sort()]);
      }
    }
    fetchCategories();
  }, [campus, supabase]);

  // Fetch venues when campus or category changes
  useEffect(() => {
    let current = true;
    async function fetchVenues() {
      setLoading(true); setError(null);
      let query = supabase
        .from("venues")
        .select(`
          *,
          services (
            price
          )
        `)
        .eq("status", "approved");
      if (campus !== "All campuses") query = query.eq("campus", campus);

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (!current) return;
      if (error) {
        setError("We couldn’t load providers. Please retry when your connection is ready.");
        setVenues([]);
      } else {
        setVenues(data || []);
      }
      setLoading(false);
    }

    fetchVenues();
    return () => { current = false; };
  }, [campus, selectedCategory, supabase, reload]);

  // Filter venues by search query (matches venue name or description)
  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  aria-label="Search providers" placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-gray-200 focus-visible:ring-primary/20"
                />
             </div>

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
          {error ? "Providers unavailable" : loading ? "Loading..." : `${filteredVenues.length} provider${filteredVenues.length !== 1 ? "s" : ""} found`}
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
        ) : error ? <div role="alert" className="bg-white border rounded-xl p-6"><p className="text-muted-foreground mb-4">{error}</p><Button onClick={() => setReload(value => value + 1)}>Retry providers</Button></div> : filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
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
