/**
 * provider/venues/[id]/services/page.tsx
 * 
 * Services management page for a specific venue.
 * Allows providers to add, edit, and delete services.
 * 
 * Features:
 * - List of existing services with duration and price
 * - Add new service form with validation
 * - Edit service inline with cancel/save options
 * - Delete service with comprehensive confirmation dialog and reason
 * 
 * Functions:
 * - fetchData: Retrieves venue and services from database
 * - handleAddService: Creates new service in database
 * - startEditing: Initiates edit mode for a service
 * - handleSaveEdit: Saves edited service to database
 * - openDeleteDialog: Opens delete confirmation dialog for a service
 * - closeDeleteDialog: Resets delete dialog state
 * - handleDeleteService: Deletes service after confirmation
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock, 
  DollarSign,
  Loader2,
  Pencil,
  X,
  Check,
  Layers,
  AlertTriangle,
  Send
} from "lucide-react";

// Service type with all fields
interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export default function VenueServicesPage() {
  const params = useParams();
  const venueId = params.id as string;
  const { user } = useAuth();
  
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  // Service data state
  const [services, setServices] = useState<Service[]>([]);
  const [venueName, setVenueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  
  // Form state for new service
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 0,
  });
  
  // Form state for editing service
  const [editService, setEditService] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 0,
  });

  /**
   * Fetches venue information and its services from the database.
   * Verifies ownership before loading data.
   */
  useEffect(() => {
    if (!user || !venueId) return;

    async function fetchData() {
      // Verify ownership and get venue name
      const { data: venue } = await supabase
        .from("venues")
        .select("name")
        .eq("id", venueId)
        .eq("owner_id", user.id)
        .single();

      if (!venue) return;
      setVenueName(venue.name);

      // Fetch all services for this venue
      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: true });

      setServices(servicesData || []);
      setLoading(false);
    }

    fetchData();
  }, [user, venueId, supabase]);

  /**
   * Handles adding a new service to the venue.
   * Validates that name is provided before inserting.
   */
  const handleAddService = async () => {
    if (!newService.name.trim()) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("services")
      .insert({
        venue_id: venueId,
        name: newService.name.trim(),
        description: newService.description.trim(),
        duration: newService.duration,
        price: newService.price,
      })
      .select()
      .single();

    if (!error && data) {
      // Add to local state and reset form
      setServices(prev => [...prev, data]);
      setNewService({ name: "", description: "", duration: 30, price: 0 });
      setShowAddForm(false);
    }
    setSaving(false);
  };

  /**
   * Starts editing mode for a service.
   * Populates edit form with current service values.
   */
  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setEditService({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
    });
  };

  /**
   * Saves the edited service to the database.
   * Updates local state on success.
   */
  const handleSaveEdit = async (serviceId: string) => {
    if (!editService.name.trim()) return;

    setSaving(true);
    const { error } = await supabase
      .from("services")
      .update({
        name: editService.name.trim(),
        description: editService.description.trim(),
        duration: editService.duration,
        price: editService.price,
      })
      .eq("id", serviceId);

    if (!error) {
      // Update local state and exit edit mode
      setServices(prev => prev.map(s => 
        s.id === serviceId 
          ? { ...s, ...editService }
          : s
      ));
      setEditingId(null);
    }
    setSaving(false);
  };

  /**
   * Opens the delete confirmation dialog for a service.
   * Resets dialog state before opening.
   */
  const openDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setDeleteReason("");
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  /**
   * Closes the delete dialog and resets all related state.
   */
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setServiceToDelete(null);
    setDeleteReason("");
    setDeleteError("");
  };

  /**
   * Handles the actual deletion of a service.
   * Requires a reason to be provided before deletion.
   * In future: could log deletion reason for audit purposes.
   */
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    // Validate that a reason was provided
    if (!deleteReason.trim()) {
      setDeleteError("Please provide a reason for removing this service.");
      return;
    }

    setDeleting(true);
    
    // Delete the service from database
    // Note: In a more complete implementation, we might want to:
    // - Store the deletion reason in an audit log
    // - Notify affected users with pending bookings
    // - Soft-delete instead of hard-delete
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceToDelete.id);

    if (!error) {
      // Remove from local state and close dialog
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      closeDeleteDialog();
    } else {
      setDeleteError("Failed to delete service. There may be active bookings.");
    }
    
    setDeleting(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link 
          href="/provider/venues" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to venues
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-1">Manage Services</h1>
        <p className="text-muted-foreground">
          {venueName}
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Services List Container */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          {/* Header with Add Button */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Services ({services.length})</h2>
            {!showAddForm && (
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            )}
          </div>

          {/* Add Service Form - collapsible */}
          {showAddForm && (
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="grid gap-4">
                <Input
                  placeholder="Service name *"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={5}
                      value={newService.duration}
                      onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newService.price}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddService} disabled={saving || !newService.name.trim()}>
                    {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Add Service
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Services List */}
          {services.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {services.map((service) => (
                <div key={service.id} className="p-4">
                  {editingId === service.id ? (
                    /* Edit Mode - inline editing form */
                    <div className="grid gap-3">
                      <Input
                        value={editService.name}
                        onChange={(e) => setEditService(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Service name"
                      />
                      <Input
                        value={editService.description}
                        onChange={(e) => setEditService(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          min={5}
                          value={editService.duration}
                          onChange={(e) => setEditService(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editService.price}
                          onChange={(e) => setEditService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(service.id)}
                          disabled={saving}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode - service card display */
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {service.duration} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            ${service.price}
                          </span>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditing(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteDialog(service)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-8 text-center">
              <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No services yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first service to start accepting bookings.
              </p>
            </div>
          )}
        </div>

        {/* Back Navigation Link */}
        <Link href={`/provider/venues/${venueId}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venue Settings
          </Button>
        </Link>
      </div>

      {/* Delete Service Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            {/* Warning Icon Header */}
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Remove Service</DialogTitle>
                <DialogDescription className="mt-1">
                  You are about to remove &quot;{serviceToDelete?.name}&quot; from your venue.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Warning Notice */}
          <div className="py-2">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action cannot be undone. Any pending bookings for this service may be affected.
              </p>
            </div>

            {/* Reason Input */}
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for Removal (Required)
            </label>
            <Textarea
              value={deleteReason}
              onChange={(e) => {
                setDeleteReason(e.target.value);
                setDeleteError(""); // Clear error on input
              }}
              placeholder="Please explain why you're removing this service. This helps us understand your needs better and may be shared with affected customers..."
              className={deleteError ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}
              rows={4}
            />
            
            {/* Error Message */}
            {deleteError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {deleteError}
              </p>
            )}
            
            {/* Helper Text */}
            <p className="text-xs text-muted-foreground mt-2">
              Example reasons: Service no longer offered, pricing changes, staff availability, etc.
            </p>
          </div>

          {/* Dialog Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteService}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
