/**
 * provider/venues/new/page.tsx
 * 
 * Create new venue page for providers.
 * Form to add a new venue with name, description, category, and image.
 * 
 * Features:
 * - Form validation
 * - Campus and category selection
 * - Image URL input
 * - Submit handling with Supabase
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Store, Loader2 } from "lucide-react";

// Available categories
const CATEGORIES = [
  "Beauty",
  "Academic",
  "Food",
  "Tech",
  "Fitness",
  "Photography/Videography",
  "Music",
  "Events",
  "Services",
  "Professional",
  "Sports",
  "Gaming",
  "Design",
  "Creative",
];

export default function NewVenuePage() {
  const router = useRouter();
  const { user } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campus: "",
    category: CATEGORIES[0],
    image_url: "",
    provider_name: "",
    provider_email: "",
    provider_phone: "",
  });

  /**
   * Handles form input changes.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handles form submission.
   * Creates a new venue in the database.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to create a venue.");
      return;
    }

    setLoading(true);
    setError(null);
    if (!formData.campus.trim()) { setError("Campus is required."); setLoading(false); return; }

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Venue name is required.");
      setLoading(false);
      return;
    }

    if (!formData.provider_name.trim()) {
      setError("Provider name is required.");
      setLoading(false);
      return;
    }

    if (!formData.provider_email.trim()) {
      setError("Provider email is required.");
      setLoading(false);
      return;
    }

    if (!formData.provider_phone.trim()) {
      setError("Provider phone number is required.");
      setLoading(false);
      return;
    }

    // Create the venue
    const { data, error: insertError } = await supabase
      .from("venues")
      .insert({
        owner_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        campus: formData.campus.trim(),
        category: formData.category,
        image_url: formData.image_url.trim() || null,
        provider_name: formData.provider_name.trim(),
        provider_email: formData.provider_email.trim(),
        provider_phone: formData.provider_phone.trim(),
        status: "pending", // New venues start as pending
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating venue:", insertError);
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Redirect to venues list
    router.push("/provider/venues");
  };

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
        <h1 className="text-2xl font-bold text-foreground mb-1">Create New Venue</h1>
        <p className="text-muted-foreground">
          Add a new service location to your provider profile
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
                placeholder="e.g., Mike's Fresh Fades"
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
                placeholder="Tell customers about your venue and services..."
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
                <input id="campus" name="campus" value={formData.campus} onChange={handleChange} required maxLength={100} placeholder="e.g. University of Pennsylvania" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
              <p className="text-xs text-muted-foreground mt-1">
                Enter a URL for your venue&apos;s cover image. Use Unsplash or other image hosting services.
              </p>
            </div>
          </div>

          {/* Provider Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Provider Contact Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This information will be visible to admins during venue review. You can be contacted via email or phone.
              </p>
            </div>

            {/* Provider Name */}
            <div>
              <label htmlFor="provider_name" className="block text-sm font-medium text-foreground mb-2">
                Your Name *
              </label>
              <Input
                id="provider_name"
                name="provider_name"
                value={formData.provider_name}
                onChange={handleChange}
                placeholder="e.g., Mike The Barber"
                required
                className="bg-white"
              />
            </div>

            {/* Provider Email */}
            <div>
              <label htmlFor="provider_email" className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <Input
                id="provider_email"
                name="provider_email"
                type="email"
                value={formData.provider_email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                className="bg-white"
              />
            </div>

            {/* Provider Phone */}
            <div>
              <label htmlFor="provider_phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number *
              </label>
              <Input
                id="provider_phone"
                name="provider_phone"
                type="tel"
                value={formData.provider_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                required
                className="bg-white"
              />
            </div>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Store className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Review Process</p>
                <p className="text-amber-700">
                  New venues are submitted for review before they appear publicly. 
                  You&apos;ll be notified once your venue is approved.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Venue
            </Button>
            <Link href="/provider/venues">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

