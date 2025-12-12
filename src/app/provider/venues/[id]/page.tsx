/**
 * provider/venues/[id]/page.tsx
 * 
 * Edit venue page for providers.
 * Allows editing venue details like name, description, and image.
 * 
 * Features:
 * - Pre-populated form with existing venue data
 * - Form validation and error handling
 * - Save changes with Supabase
 * - Delete venue functionality
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Trash2, Store } from "lucide-react";

// Available categories
const CATEGORIES = [
  "Beauty", "Academic", "Food", "Tech", "Fitness", "Photography/Videography",
  "Music", "Events", "Services", "Professional", "Sports", "Gaming",
  "Design", "Creative",
];

// Available campuses
const CAMPUSES = ["State University", "Ivy College", "Tech Institute"];

export default function EditVenuePage() {
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;
  const { user } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campus: "",
    category: "",
    image_url: "",
    provider_name: "",
    provider_email: "",
    provider_phone: "",
  });

  // Fetch venue data
  useEffect(() => {
    if (!user || !venueId) return;

    async function fetchVenue() {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", venueId)
        .eq("owner_id", user?.id)
        .single();

      if (error || !data) {
        router.push("/provider/venues");
        return;
      }

      setFormData({
        name: data.name || "",
        description: data.description || "",
        campus: data.campus || CAMPUSES[0],
        category: data.category || CATEGORIES[0],
        image_url: data.image_url || "",
        provider_name: data.provider_name || "",
        provider_email: data.provider_email || "",
        provider_phone: data.provider_phone || "",
      });
      setLoading(false);
    }

    fetchVenue();
  }, [user, venueId, supabase, router]);

  /**
   * Handles form input changes.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handles form submission to update venue.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setSaving(true);
    setError(null);

    if (!formData.name.trim()) {
      setError("Venue name is required.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("venues")
      .update({
        name: formData.name.trim(),
        description: formData.description.trim(),
        campus: formData.campus,
        category: formData.category,
        image_url: formData.image_url.trim() || null,
        provider_name: formData.provider_name.trim() || null,
        provider_email: formData.provider_email.trim() || null,
        provider_phone: formData.provider_phone.trim() || null,
      })
      .eq("id", venueId)
      .eq("owner_id", user?.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/provider/venues");
  };

  /**
   * Handles venue deletion.
   */
  const handleDelete = async () => {
    if (!user || !confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    const { error: deleteError } = await supabase
      .from("venues")
      .delete()
      .eq("id", venueId)
      .eq("owner_id", user?.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    router.push("/provider/venues");
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/provider/venues" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to venues
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-1">Edit Venue</h1>
        <p className="text-muted-foreground">
          Update your venue details
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Venue Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Venue Name *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-white"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Campus and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="campus" className="block text-sm font-medium text-foreground mb-2">
                  Campus *
                </label>
                <select
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  {CAMPUSES.map(campus => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-foreground mb-2">
                Cover Image URL
              </label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="bg-white"
              />
            </div>
          </div>

          {/* Provider Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Provider Contact Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This information will be visible to admins during venue review. You can be contacted via email or phone.
              </p>
            </div>

            {/* Provider Name */}
            <div>
              <label htmlFor="provider_name" className="block text-sm font-medium text-foreground mb-2">
                Your Name
              </label>
              <Input
                id="provider_name"
                name="provider_name"
                value={formData.provider_name}
                onChange={handleChange}
                placeholder="e.g., Mike The Barber"
                className="bg-white"
              />
            </div>

            {/* Provider Email */}
            <div>
              <label htmlFor="provider_email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                id="provider_email"
                name="provider_email"
                type="email"
                value={formData.provider_email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="bg-white"
              />
            </div>

            {/* Provider Phone */}
            <div>
              <label htmlFor="provider_phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <Input
                id="provider_phone"
                name="provider_phone"
                type="tel"
                value={formData.provider_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="bg-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Link href="/provider/venues">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Venue
            </Button>
          </div>
        </form>

        {/* Services link */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Manage Services</p>
                <p className="text-sm text-muted-foreground">Add or edit services for this venue</p>
              </div>
            </div>
            <Link href={`/provider/venues/${venueId}/services`}>
              <Button variant="outline">Manage Services</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

