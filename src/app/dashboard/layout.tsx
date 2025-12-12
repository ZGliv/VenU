/**
 * dashboard/layout.tsx
 * 
 * Layout component for the user dashboard.
 * Provides navigation for student/customer users.
 * 
 * Features:
 * - Simple top navigation
 * - Responsive design
 * - Consistent structure for all user dashboard pages
 */

import { Navbar } from "@/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}

