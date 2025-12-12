/**
 * provider/settings/page.tsx
 * 
 * Provider settings page.
 * Allows providers to update their profile information.
 * 
 * Features:
 * - Edit display name
 * - View account email
 * - View role information
 */

"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Shield, Loader2, Check } from "lucide-react";

export default function ProviderSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /**
   * Saves profile changes.
   */
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ name: name.trim() })
      .eq("id", user.id);

    if (!error) {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Manage your provider profile
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </h2>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Display Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Email is managed through your Google account.
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : null}
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-medium text-foreground capitalize">
                {profile?.role?.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-muted-foreground">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Active
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium text-foreground">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString("en-US", { 
                      month: "long", 
                      year: "numeric" 
                    })
                  : "N/A"
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

