/**
 * venue-actions.tsx
 * 
 * Client component for venue action buttons (favorite and share).
 * Handles favoriting venues and sharing venue links.
 * 
 * Features:
 * - Favorite/unfavorite venues with heart button
 * - Copy venue link to clipboard with share button
 * - Toast notifications for user feedback
 * - Syncs favorite state with Supabase
 */

"use client";

import { Button } from "@/components/ui/button";
import { Heart, Share2, Check, Link2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// Props for the venue actions component
interface VenueActionsProps {
  venueId: string;
  venueName: string;
}

export function VenueActions({ venueId, venueName }: VenueActionsProps) {
  // State for favorite status and UI feedback
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Memoize supabase client to prevent recreation on every render
  const supabase = createClient();

  // Check if user has favorited this venue on mount
  useEffect(() => {
    async function checkFavoriteStatus() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Check if venue is favorited
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("venue_id", venueId)
        .single();

      setIsFavorited(!!data);
      setIsLoading(false);
    }

    checkFavoriteStatus();
  }, [venueId, supabase]);

  // Handle favorite toggle
  const handleFavorite = useCallback(async () => {
    if (!userId) {
      // Could redirect to sign in or show a message
      alert("Please sign in to save favorites");
      return;
    }

    setIsLoading(true);

    if (isFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("venue_id", venueId);

      if (!error) {
        setIsFavorited(false);
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, venue_id: venueId });

      if (!error) {
        setIsFavorited(true);
      }
    }

    setIsLoading(false);
  }, [userId, isFavorited, venueId, supabase]);

  // Handle share/copy link
  const handleShare = useCallback(async () => {
    const url = window.location.href;

    try {
      // Try native share API first (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: venueName,
          text: `Check out ${venueName} on VenU!`,
          url: url,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch {
      // If share is cancelled or fails, try clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch {
        // Last resort: show URL in alert
        alert(`Copy this link: ${url}`);
      }
    }
  }, [venueName]);

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2">
      {/* Favorite Button */}
      <Button
        size="icon"
        variant="secondary"
        className={`h-10 w-10 rounded-full backdrop-blur-sm transition-all ${
          isFavorited
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-white/90 hover:bg-white"
        }`}
        onClick={handleFavorite}
        disabled={isLoading}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-5 w-5 transition-all ${
            isFavorited ? "fill-current" : ""
          }`}
        />
      </Button>

      {/* Share Button */}
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all"
        onClick={handleShare}
        aria-label="Share venue"
      >
        {showCopied ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <Share2 className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
