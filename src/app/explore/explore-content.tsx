"use client";

import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const campus = searchParams.get("campus") || "State University";
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "All");
  const [venues, setVenues] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch all categories upfront (once per campus change)
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

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white selection:bg-white/20">
      <Navbar />
      
      <div className="container px-4 md:px-6 py-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
             <h1 className="text-3xl font-bold tracking-tight mb-2">Explore Campus</h1>
             <div className="flex items-center text-white/50 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {campus}
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input 
                  placeholder="Search providers..." 
                  className="pl-9 bg-[#1e1e1e] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                />
             </div>
             <Button variant="outline" className="border-white/10 bg-[#1e1e1e] text-white hover:bg-[#252525] hover:text-white">
                <Filter className="h-4 w-4 mr-2" />
                Filters
             </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-6 scrollbar-hide">
             {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-white text-black" 
                      : "bg-[#1e1e1e] border border-white/10 text-white/70 hover:text-white hover:border-white/30"
                  }`}
                >
                  {cat}
                </button>
             ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-white/50">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {venues.map((venue) => (
                <Link href={`/dashboard/venues/${venue.id}`} key={venue.id} className="group block">
                   <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/5 transition-all hover:border-white/20 hover:translate-y-[-2px]">
                      {/* Image */}
                      <div className="aspect-[4/3] relative bg-[#252525]">
                          <Image 
                            src={venue.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop&q=60'} 
                            alt={venue.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 text-white">
                              <Star className="h-3 w-3 fill-white text-white" /> 4.9
                          </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                         <h3 className="font-bold text-lg text-white mb-1">{venue.name}</h3>
                         <p className="text-sm text-white/50 line-clamp-1 mb-4">{venue.description}</p>
                         
                         <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <div className="text-xs text-white/40">
                               {venue.services?.length || 0} services available
                            </div>
                            <div className="text-sm font-medium text-white">
                               From ${Math.min(...(venue.services?.map((s: any) => s.price) || [0]))}
                            </div>
                         </div>
                      </div>
                   </div>
                </Link>
              ))}
            </div>
            
            {venues.length === 0 && (
               <div className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      {selectedCategory !== "All" ? `No ${selectedCategory} providers found` : "No providers found yet"}
                    </h3>
                    <p className="text-white/60 mb-6">
                      {selectedCategory !== "All" 
                        ? `Try selecting a different category or check back later.`
                        : `Be the first to add a provider at ${campus}!`}
                    </p>
                    {selectedCategory !== "All" && (
                      <Button 
                        onClick={() => setSelectedCategory("All")}
                        variant="outline"
                        className="border-white/10 bg-[#1e1e1e] text-white hover:bg-[#252525]"
                      >
                        View All Categories
                      </Button>
                    )}
                  </div>
               </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

