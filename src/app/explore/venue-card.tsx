/**
 * venue-card.tsx
 * 
 * Client component for individual venue cards on the explore page.
 * Displays venue information with an interactive favorite button.
 * 
 * Features:
 * - Venue image with category and rating badges
 * - Favorite/unfavorite button with heart icon
 * - Toast notifications for favorite actions
 * - Responsive hover effects
 * - Links to venue detail page
 * 
 * Functions:
 * - VenueCard: Main component that renders a venue card with favorite functionality
 * - checkFavoriteStatus: Checks if user has favorited this venue on mount
 * - handleFavoriteClick: Toggles favorite status in Supabase database with toast feedback
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Props interface for the VenueCard component
interface VenueCardProps {
  venue: {
    id: string;
    name: string;
    description: string;
    category: string;
    image_url: string | null;
    services: { price: number }[];
  };
}

export function VenueCard({ venue }: VenueCardProps) {
  // State for favorite status and loading
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  /**
   * Checks if the current user has favorited this venue.
   * Runs on component mount to set initial favorite state.
   */
  useEffect(() => {
    async function checkFavoriteStatus() {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in, can't have favorites
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Query the favorites table to check if this venue is favorited
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("venue_id", venue.id)
        .single();

      // If data exists, venue is favorited
      setIsFavorited(!!data);
      setIsLoading(false);
    }

    checkFavoriteStatus();
  }, [venue.id, supabase]);

  /**
   * Handles the favorite button click.
   * Adds or removes the venue from user's favorites.
   */
  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    // Prevent the click from navigating to the venue page
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      // User not logged in, show message
      toast.error("Please sign in to save favorites", { id: "favorite-auth" });
      return;
    }

    setIsLoading(true);

    // Use consistent toastId to replace previous toasts instead of stacking
    const toastId = `favorite-${venue.id}`;

    if (isFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("venue_id", venue.id);

      if (!error) {
        setIsFavorited(false);
        toast.error("Removed from favorites", { id: toastId });
      } else {
        toast.error("Failed to remove from favorites", { id: toastId });
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, venue_id: venue.id });

      if (!error) {
        setIsFavorited(true);
        toast.success("Added to favorites", { id: toastId });
      } else {
        toast.error("Failed to add to favorites", { id: toastId });
      }
    }

    setIsLoading(false);
  }, [userId, isFavorited, venue.id, supabase]);

  /**
   * Calculates the minimum price from a venue's services.
   * Returns 0 if no services available.
   */
  const getMinPrice = (services: { price: number }[]) => {
    if (!services || services.length === 0) return 0;
    return Math.min(...services.map(s => s.price));
  };

  return (
    <Link href={`/dashboard/venues/${venue.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 transition-all hover:border-gray-200 hover:shadow-lg hover:-translate-y-1 duration-300">
        {/* Image container */}
        <div className="aspect-[4/3] relative bg-gray-100">
          <Image 
            src={venue.image_url || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop&q=60"} 
            alt={venue.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Category badge - top left */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground/80 shadow-sm">
            {venue.category}
          </div>

          {/* Favorite button - bottom right of image */}
          <Button
            size="icon"
            variant="secondary"
            className={`absolute bottom-3 right-3 h-9 w-9 rounded-full backdrop-blur-sm transition-all z-10 ${
              isFavorited
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/90 hover:bg-white text-gray-600 hover:text-red-500"
            }`}
            onClick={handleFavoriteClick}
            disabled={isLoading}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 transition-all ${
                isFavorited ? "fill-current" : ""
              }`}
            />
          </Button>
        </div>

        {/* Content section */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {venue.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
            {venue.description}
          </p>
               
          {/* Footer with service count and pricing */}
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
  );
}
