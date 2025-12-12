/**
 * auth-provider.tsx
 * 
 * Authentication context provider for VenU.
 * Manages user authentication state across the application using Supabase Auth.
 * Provides user data and loading state to all child components.
 * 
 * Exports:
 * - AuthProvider: Context provider component that wraps the app
 * - useAuth: Hook to access auth state (user, loading, signOut)
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

/**
 * Shape of the user profile data from the public.users table.
 * Extends the basic Supabase auth user with VenU-specific fields.
 */
interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: "student" | "venue_owner" | "admin";
  avatar_url: string | null;
  status?: "active" | "suspended";
  created_at: string;
  updated_at: string;
}

/**
 * Auth context value shape.
 * Contains user state and authentication methods.
 */
interface AuthContextValue {
  user: User | null;              // Supabase auth user object
  profile: UserProfile | null;    // VenU user profile from public.users
  session: Session | null;        // Current auth session
  loading: boolean;               // True while checking auth state
  signOut: () => Promise<void>;   // Sign out function
  refreshProfile: () => Promise<void>; // Refresh user profile from DB
}

// Create context with undefined default (will throw if used outside provider)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider component.
 * Wraps the application and provides authentication state to all children.
 * Listens for auth state changes and syncs with Supabase.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Create Supabase client once per component lifecycle
  const [supabase] = useState(() => createClient());

  /**
   * Fetches or creates a user profile from the database.
   * If no profile exists and auth user info is provided, creates a new profile.
   */
  const fetchOrCreateProfile = useCallback(async (userId: string, authUser?: User): Promise<UserProfile | null> => {
    try {
      // Fetch existing profile
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      // If profile exists, return it
      if (data) {
        return data as UserProfile;
      }

      // If no profile found (PGRST116 = no rows) and we have auth user info, create one
      if (error?.code === "PGRST116" && authUser) {
        const newProfile = {
          id: userId,
          email: authUser.email || "",
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
          role: "student" as const,
          status: "active" as const,
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error("Error creating user profile:", createError);
          return null;
        }

        return createdProfile as UserProfile;
      }

      // Some other error occurred
      if (error) {
        console.error("Error fetching user profile:", error);
      }

      return null;
    } catch (err) {
      console.error("Error in fetchOrCreateProfile:", err);
      return null;
    }
  }, [supabase]);

  /**
   * Refreshes the user profile from the database.
   */
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const newProfile = await fetchOrCreateProfile(user.id, user);
      setProfile(newProfile);
    }
  }, [user, fetchOrCreateProfile]);

  /**
   * Signs out the current user.
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, [supabase]);

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    let isMounted = true;
    let isInitialized = false;

    // Set up auth state change listener for ONGOING changes only (after initialization)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        
        // Update session and user immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Skip early events until we're initialized
        // The SIGNED_IN event fires before the client is fully ready to make DB queries
        if (!isInitialized && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          return;
        }

        // Handle sign out
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Handle new sign-ins after initialization
        if (event === "SIGNED_IN" && newSession?.user) {
          const userProfile = await fetchOrCreateProfile(newSession.user.id, newSession.user);
          if (isMounted) {
            setProfile(userProfile);
            setLoading(false);
          }
        }
      }
    );

    // Initialize by getting session and then fetching profile
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) setLoading(false);
          return;
        }
        
        // Update state
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
        
        // Fetch profile if we have a session
        if (currentSession?.user && isMounted) {
          const userProfile = await fetchOrCreateProfile(
            currentSession.user.id,
            currentSession.user
          );
          if (isMounted) {
            setProfile(userProfile);
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        if (isMounted) {
          isInitialized = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchOrCreateProfile]);

  // Context value
  const value: AuthContextValue = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
