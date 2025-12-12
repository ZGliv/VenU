/**
 * provider/venues/page.tsx
 * 
 * Provider venues list page.
 * Displays all venues owned by the current provider with status indicators.
 * 
 * Features:
 * - List of provider's venues with images
 * - Status badges (pending, approved, rejected)
 * - Quick links to edit venue and manage services
 * - Empty state for new providers
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Store, 
  Settings, 
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Pencil,
  Layers
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Venue type
interface Venue {
  id: string;
  name: string;
  description: string;
  campus: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  image_url: string | null;
  services: { id: string }[];
}

export default function ProviderVenuesPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchVenues() {
      setLoading(true);
      const { data, error } = await supabase
        .from("venues")
        .select(`
          *,
          services (id)
        `)
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching venues:", error);
      } else {
        setVenues(data || []);
      }
      setLoading(false);
    }

    fetchVenues();
  }, [user, supabase]);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: { 
        icon: Clock, 
        label: "Pending Review", 
        className: "bg-amber-100 text-amber-700" 
      },
      approved: { 
        icon: CheckCircle, 
        label: "Approved", 
        className: "bg-emerald-100 text-emerald-700" 
      },
      rejected: { 
        icon: XCircle, 
        label: "Rejected", 
        className: "bg-red-100 text-red-700" 
      },
    };
    const { icon: Icon, label, className } = config[status as keyof typeof config] || config.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">My Venues</h1>
          <p className="text-muted-foreground">
            Manage your service locations and offerings
          </p>
        </div>
        <Link href="/provider/venues/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Venue
          </Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : venues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              onClick={() => router.push(`/provider/venues/${venue.id}`)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Image */}
              <div className="aspect-video relative bg-gray-100">
                {venue.image_url ? (
                  <Image 
                    src={venue.image_url} 
                    alt={venue.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-3 left-3">
                  <StatusBadge status={venue.status} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {venue.campus} | {venue.category}
                    </p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/provider/venues/${venue.id}`} className="flex items-center">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Venue
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/provider/venues/${venue.id}/services`} className="flex items-center">
                            <Layers className="h-4 w-4 mr-2" />
                            Manage Services
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/venues/${venue.id}`} className="flex items-center">
                            <Store className="h-4 w-4 mr-2" />
                            View Public Page
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {venue.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    {venue.services?.length || 0} services
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Link href={`/provider/venues/${venue.id}/services`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No venues yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first venue to start offering services to students on campus.
          </p>
          <Link href="/provider/venues/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Venue
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

