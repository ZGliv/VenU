/**
 * provider-card.tsx
 * 
 * Client component for the Provider card in the venue detail page sidebar.
 * Displays provider information with two modals:
 * - About modal: Shows provider bio (triggered by clicking the card)
 * - Contact modal: Shows contact information (triggered by clicking Contact button)
 * 
 * Functions:
 * - ProviderCard: Main component that renders the provider card with modals
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle, Mail, Phone, User, Maximize2 } from "lucide-react";
import Image from "next/image";

// Provider data interface
interface ProviderCardProps {
  providerName: string | null;
  providerAvatar: string | null;
  providerBio: string | null;
  venueName: string;
  providerContactName: string | null;
  providerEmail: string | null;
  providerPhone: string | null;
}

export function ProviderCard({
  providerName,
  providerAvatar,
  providerBio,
  venueName,
  providerContactName,
  providerEmail,
  providerPhone,
}: ProviderCardProps) {
  // Get initials for avatar fallback
  const initials = providerName?.[0]?.toUpperCase() || "P";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 group transition-all hover:shadow-lg hover:shadow-violet-500/10">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* Expand icon hint in top right corner */}
        <div className="absolute -top-0.5 -right-0.5 p-1.5 rounded-lg bg-slate-700/80 text-slate-300 pointer-events-none z-20">
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
        
        {/* About Modal - triggered by clicking the card */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer pr-12">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Provider
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-slate-700 overflow-hidden relative flex-shrink-0 ring-2 ring-slate-600">
                  {providerAvatar ? (
                    <Image 
                      src={providerAvatar} 
                      alt={providerName || "Provider"} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">{providerName || "Provider"}</div>
                  <div className="text-sm text-slate-400">Joined 2024</div>
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden relative flex-shrink-0">
                  {providerAvatar ? (
                    <Image 
                      src={providerAvatar} 
                      alt={providerName || "Provider"} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <div>{providerName || "Provider"}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {venueName}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Bio Section */}
              {providerBio ? (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">About</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {providerBio}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  This provider hasn&apos;t added a bio yet.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Contact Button - opens Contact modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white border-0 group-hover:shadow-lg group-hover:shadow-violet-500/25 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden relative flex-shrink-0">
                  {providerAvatar ? (
                    <Image 
                      src={providerAvatar} 
                      alt={providerName || "Provider"} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-500 text-white font-bold text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <div>{providerName || "Provider"}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {venueName}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Contact Section */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Contact Information</h4>
                <div className="space-y-3">
                  {providerContactName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{providerContactName}</span>
                    </div>
                  )}
                  {providerEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${providerEmail}`}
                        className="text-primary hover:underline"
                      >
                        {providerEmail}
                      </a>
                    </div>
                  )}
                  {providerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${providerPhone.replace(/[^\d+]/g, '')}`}
                        className="text-primary hover:underline"
                      >
                        {providerPhone}
                      </a>
                    </div>
                  )}
                  {!providerEmail && !providerPhone && !providerContactName && (
                    <p className="text-sm text-muted-foreground italic">
                      Contact information not available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
