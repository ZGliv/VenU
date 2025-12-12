/**
 * layout.tsx
 * 
 * Root layout component for VenU application.
 * Wraps all pages with global providers, fonts, and metadata.
 * 
 * Provides:
 * - Inter font family
 * - AuthProvider for authentication state
 * - DevPanel for development role switching (dev mode only)
 * - Global CSS styles
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { DevPanel } from "@/components/dev-panel";

// Configure Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] });

// SEO metadata for the application
export const metadata: Metadata = {
  title: "VenU - Campus Services Marketplace",
  description: "Find and book local services on your campus.",
};

/**
 * Root layout component.
 * Wraps all pages with necessary providers and global styles.
 * 
 * @param children - Page content to render
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <DevPanel />
        </AuthProvider>
      </body>
    </html>
  );
}

