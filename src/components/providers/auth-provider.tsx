"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const loadProfile = useCallback(async (userId: string) => {
    // Signup creates a student profile in the database trigger. Roles are never
    // inferred from a public environment variable or edited during sign-in.
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error) throw new Error("We couldn’t load your account. Try again when the connection is restored.");
    return data as UserProfile;
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      setProfile(await loadProfile(user.id));
      setProfileError(null);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not load your account.");
    }
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSession(null); setProfileError(null);
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    let revision = 0;
    const sync = async (next: Session | null) => {
      const version = ++revision;
      setSession(next); setUser(next?.user ?? null); setProfile(null);
      if (!next) { setLoading(false); setProfileError(null); return; }
      try {
        const fetched = await loadProfile(next.user.id);
        if (alive && version === revision) { setProfile(fetched); setProfileError(null); }
      } catch (error) {
        if (alive && version === revision) setProfileError(error instanceof Error ? error.message : "Could not load your account.");
      } finally {
        if (alive && version === revision) setLoading(false);
      }
    };
    // Do not await another Supabase request while its auth event lock is held.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      window.setTimeout(() => { if (alive) void sync(next); }, 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || revision) return;
      if (error) { setProfileError("We couldn’t check your session. Please try again."); setLoading(false); }
      else void sync(data.session);
    }).catch(() => { if (alive) { setProfileError("We couldn’t reach sign-in. Please try again."); setLoading(false); } });
    return () => { alive = false; revision++; subscription.unsubscribe(); };
  }, [supabase, loadProfile]);

  return <AuthContext.Provider value={{ user, profile, session, loading, profileError, signOut, refreshProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
