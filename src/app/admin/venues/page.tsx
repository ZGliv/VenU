/**
 * admin/venues/page.tsx
 * 
 * Admin venue management page.
 * Displays all venues with ability to approve/reject pending ones.
 * 
 * Features:
 * - List of all venues with filtering by status
 * - Clickable venue cards that navigate to venue detail preview
 * - URL query parameter support for pre-selecting filter (e.g., ?status=pending)
 * - Approve venues with welcome message dialog
 * - Reject venues with required reason dialog
 * - Revoke approved venues with required reason dialog
 * - Admin message only visible in venue detail view (not list)
 * 
 * Functions:
 * - fetchVenues: Retrieves all venues with owner info from database
 * - updateVenueStatus: Updates venue status with admin message
 * - openApproveDialog: Opens approval confirmation dialog
 * - openRejectDialog: Opens rejection dialog with reason input
 * - openRevokeDialog: Opens revocation dialog with reason input
 * - closeDialog: Resets dialog state and clears form
 * - getStatusBadge: Returns styling config for status badges
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  AlertTriangle,
  Send,
  ShieldCheck,
  ShieldX
} from "lucide-react";

// Venue type with owner information
interface Venue {
  id: string;
  name: string;
  description: string;
  campus: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  image_url: string | null;
  admin_message: string | null;
  status_updated_at: string | null;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

// Dialog action types for different operations
type DialogAction = "approve" | "reject" | "revoke" | null;

// Status filter options for venue list
const STATUS_FILTERS = [
  { value: "all", label: "All Venues" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminVenuesPage() {
  // Get URL search params to read initial filter value
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  // Venue data state
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filter from URL param or default to "all"
  const initialFilter = searchParams.get("status") || "all";
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Dialog state for approval/rejection/revocation
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [messageError, setMessageError] = useState("");

  /**
   * Updates filter when URL search params change.
   * Allows navigation with pre-selected filter state.
   */
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus && ["all", "pending", "approved", "rejected"].includes(urlStatus)) {
      setStatusFilter(urlStatus);
    }
  }, [searchParams]);

  /**
   * Fetches all venues with owner information from the database.
   * Orders by created_at descending to show newest first.
   * Uses service role client for admin access to all venues.
   */
  useEffect(() => {
    async function fetchVenues() {
      setLoading(true);
      setError(null);
      
      // Fetch venues with owner info using explicit foreign key reference
      const { data, error: fetchError } = await supabase
        .from("venues")
        .select(`
          *,
          users:owner_id (name, email)
        `)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching venues:", fetchError);
        setError(`Failed to load venues: ${fetchError.message}`);
        setVenues([]);
      } else {
        setVenues(data || []);
      }
      setLoading(false);
    }

    fetchVenues();
  }, [supabase]);

  /**
   * Opens the approval dialog for a venue.
   * Pre-populates with a default welcome message.
   */
  const openApproveDialog = (venue: Venue) => {
    setSelectedVenue(venue);
    setDialogAction("approve");
    // Pre-fill with a welcoming message
    setAdminMessage(`Congratulations! Your venue "${venue.name}" has been approved and is now live on VenU. Students can start discovering and booking your services.\n\nWelcome to the VenU community!`);
    setMessageError("");
    setDialogOpen(true);
  };

  /**
   * Opens the rejection dialog for a pending venue.
   * Requires admin to provide a reason for rejection.
   */
  const openRejectDialog = (venue: Venue) => {
    setSelectedVenue(venue);
    setDialogAction("reject");
    setAdminMessage("");
    setMessageError("");
    setDialogOpen(true);
  };

  /**
   * Opens the revocation dialog for an approved venue.
   * Requires admin to provide a reason for revoking approval.
   */
  const openRevokeDialog = (venue: Venue) => {
    setSelectedVenue(venue);
    setDialogAction("revoke");
    setAdminMessage("");
    setMessageError("");
    setDialogOpen(true);
  };

  /**
   * Closes the dialog and resets all dialog-related state.
   */
  const closeDialog = () => {
    setDialogOpen(false);
    setDialogAction(null);
    setSelectedVenue(null);
    setAdminMessage("");
    setMessageError("");
  };

  /**
   * Updates venue status with admin message.
   * Validates that rejection/revocation includes a reason.
   * Updates local state optimistically after successful database update.
   */
  const updateVenueStatus = async () => {
    if (!selectedVenue || !dialogAction) return;

    // Validate rejection/revocation requires a message
    if ((dialogAction === "reject" || dialogAction === "revoke") && !adminMessage.trim()) {
      setMessageError("Please provide a reason for this action.");
      return;
    }

    setUpdating(selectedVenue.id);

    // Determine the new status based on action
    const newStatus = dialogAction === "approve" ? "approved" : "rejected";

    // Update venue in database with status, message, and timestamp
    const { error } = await supabase
      .from("venues")
      .update({ 
        status: newStatus,
        admin_message: adminMessage.trim() || null,
        status_updated_at: new Date().toISOString()
      })
      .eq("id", selectedVenue.id);

    if (!error) {
      // Update local state to reflect changes immediately
      setVenues(prev => prev.map(v => 
        v.id === selectedVenue.id 
          ? { 
              ...v, 
              status: newStatus,
              admin_message: adminMessage.trim() || null,
              status_updated_at: new Date().toISOString()
            }
          : v
      ));
      closeDialog();
    } else {
      setMessageError("Failed to update venue status. Please try again.");
    }
    
    setUpdating(null);
  };

  /**
   * Returns styling configuration for status badges.
   * Different colors for pending (amber), approved (emerald), and rejected (red).
   */
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      approved: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  /**
   * Returns dialog configuration based on current action.
   * Provides title, description, icon, and button styling for each action type.
   */
  const getDialogConfig = () => {
    switch (dialogAction) {
      case "approve":
        return {
          title: "Approve Venue",
          description: `You are about to approve "${selectedVenue?.name}". This will make the venue visible to all students on VenU.`,
          icon: ShieldCheck,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-100",
          buttonText: "Approve Venue",
          buttonClass: "bg-emerald-600 hover:bg-emerald-700",
          messagePlaceholder: "Write a welcome message for the venue owner (optional but recommended)...",
          messageRequired: false,
        };
      case "reject":
        return {
          title: "Reject Venue",
          description: `You are about to reject "${selectedVenue?.name}". The owner will be notified with your reason.`,
          icon: ShieldX,
          iconColor: "text-red-600",
          iconBg: "bg-red-100",
          buttonText: "Reject Venue",
          buttonClass: "bg-red-600 hover:bg-red-700",
          messagePlaceholder: "Explain why this venue is being rejected. Be specific so the owner can address the issues...",
          messageRequired: true,
        };
      case "revoke":
        return {
          title: "Revoke Venue Approval",
          description: `You are about to revoke approval for "${selectedVenue?.name}". This venue will no longer be visible to students.`,
          icon: AlertTriangle,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-100",
          buttonText: "Revoke Approval",
          buttonClass: "bg-red-600 hover:bg-red-700",
          messagePlaceholder: "Explain why this venue's approval is being revoked. Include any policy violations or issues...",
          messageRequired: true,
        };
      default:
        return null;
    }
  };

  // Filter venues by status for display
  const filteredVenues = statusFilter === "all" 
    ? venues 
    : venues.filter(v => v.status === statusFilter);

  // Get current dialog configuration
  const dialogConfig = getDialogConfig();

  // Loading state
  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Venues</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header with venue counts and filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Venue Management</h1>
          <p className="text-muted-foreground">
            {venues.length} total venues | {venues.filter(v => v.status === "pending").length} pending review
          </p>
        </div>
        
        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {STATUS_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Venues List */}
      {filteredVenues.length > 0 ? (
        <div className="space-y-4">
          {filteredVenues.map((venue) => {
            const statusConfig = getStatusBadge(venue.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={venue.id} 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/venues/${venue.id}?from=admin`)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Venue Image */}
                  <div className="md:w-48 h-40 md:h-auto relative bg-gray-100 flex-shrink-0">
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
                  </div>

                  {/* Venue Content */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Venue Name and Status Badge */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground text-lg">
                            {venue.name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="h-3 w-3" />
                            {venue.status}
                          </span>
                        </div>

                        {/* Venue Description */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {venue.description}
                        </p>

                        {/* Venue Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium">{venue.campus}</span>
                          <span className="text-gray-300">|</span>
                          <span>{venue.category}</span>
                          <span className="text-gray-300">|</span>
                          <span>By: {venue.users?.name || venue.users?.email}</span>
                          <span className="text-gray-300">|</span>
                          <span>{new Date(venue.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Pending Venue Actions: Approve and Reject */}
                        {venue.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openApproveDialog(venue)}
                              disabled={updating === venue.id}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectDialog(venue)}
                              disabled={updating === venue.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* Rejected Venue Actions: Re-approve */}
                        {venue.status === "rejected" && (
                          <Button
                            size="sm"
                            onClick={() => openApproveDialog(venue)}
                            disabled={updating === venue.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}

                        {/* Approved Venue Actions: Revoke */}
                        {venue.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRevokeDialog(venue)}
                            disabled={updating === venue.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {statusFilter === "all" ? "No venues yet" : `No ${statusFilter} venues`}
          </h3>
          <p className="text-muted-foreground">
            {statusFilter === "all" 
              ? "Venues will appear here when providers create them."
              : "Try selecting a different filter."}
          </p>
        </div>
      )}

      {/* Approval/Rejection/Revocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {dialogConfig && (
            <>
              <DialogHeader>
                {/* Icon Header */}
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-3 rounded-full ${dialogConfig.iconBg}`}>
                    <dialogConfig.icon className={`h-6 w-6 ${dialogConfig.iconColor}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{dialogConfig.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {dialogConfig.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Message Input Section */}
              <div className="py-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {dialogConfig.messageRequired ? "Reason (Required)" : "Message to Venue Owner"}
                </label>
                <Textarea
                  value={adminMessage}
                  onChange={(e) => {
                    setAdminMessage(e.target.value);
                    setMessageError(""); // Clear error on input
                  }}
                  placeholder={dialogConfig.messagePlaceholder}
                  className={messageError ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}
                  rows={5}
                />
                {/* Error Message */}
                {messageError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {messageError}
                  </p>
                )}
                
                {/* Helper Text */}
                <p className="text-xs text-muted-foreground mt-2">
                  {dialogAction === "approve" 
                    ? "This message will be sent to the venue owner as a welcome notification."
                    : "This message will be sent to the venue owner to explain your decision."}
                </p>
              </div>

              {/* Dialog Footer with Actions */}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={updating !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateVenueStatus}
                  disabled={updating !== null}
                  className={dialogConfig.buttonClass}
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {dialogConfig.buttonText}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
