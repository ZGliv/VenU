/**
 * admin/users/page.tsx
 * 
 * Admin user management page.
 * Displays all users with ability to suspend/unsuspend accounts.
 * 
 * Features:
 * - List of all users
 * - Filter by role
 * - Suspend/unsuspend users
 * - View user details
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users,
  Search,
  Shield,
  Store,
  User,
  Ban,
  CheckCircle,
  Loader2,
  Filter
} from "lucide-react";

// User type
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "venue_owner" | "admin";
  status: "active" | "suspended";
  created_at: string;
}

// Role filter options
const ROLE_FILTERS = [
  { value: "all", label: "All Users" },
  { value: "student", label: "Students" },
  { value: "venue_owner", label: "Providers" },
  { value: "admin", label: "Admins" },
];

export default function AdminUsersPage() {
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setUsers(data || []);
      }
      setLoading(false);
    }

    fetchUsers();
  }, [supabase]);

  /**
   * Toggles user suspension status.
   */
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    setUpdating(userId);
    const newStatus = currentStatus === "active" ? "suspended" : "active";

    const { error } = await supabase
      .from("users")
      .update({ status: newStatus })
      .eq("id", userId);

    if (!error) {
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, status: newStatus as UserProfile["status"] }
          : u
      ));
    }
    setUpdating(null);
  };

  /**
   * Gets role icon.
   */
  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield className="h-4 w-4" />;
    if (role === "venue_owner") return <Store className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  /**
   * Gets role badge styling.
   */
  const getRoleBadge = (role: string) => {
    if (role === "admin") return "bg-red-100 text-red-700";
    if (role === "venue_owner") return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  // Filter users by search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">User Management</h1>
          <p className="text-muted-foreground">
            {users.length} total users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {ROLE_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-foreground">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role === "venue_owner" ? "Provider" : user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "active" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {user.status === "active" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Ban className="h-3 w-3" />
                      )}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {user.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        disabled={updating === user.id}
                        className={user.status === "active" 
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }
                      >
                        {updating === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.status === "active" ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

