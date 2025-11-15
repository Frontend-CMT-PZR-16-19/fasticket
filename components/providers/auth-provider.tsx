"use client";

// =====================================================
// Auth Context Provider
// Provides authentication state and user data
// =====================================================

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Organization, OrganizationRole } from "@/types/database";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organizations: (Organization & { role: OrganizationRole })[];
  isOrganizerAnywhere: boolean;
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<(Organization & { role: OrganizationRole })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchOrganizations = async (userId: string) => {
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        role,
        organization:organizations (
          id,
          name,
          slug,
          description,
          logo_url,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId);

    if (!error && data) {
      const orgs = data
        .map((item: any) => ({
          ...item.organization,
          role: item.role,
        }))
        .filter((org: any) => org.id);
      setOrganizations(orgs);
    } else {
      setOrganizations([]);
    }
  };

  const refreshOrganizations = async () => {
    if (user) {
      await fetchOrganizations(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchOrganizations(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchOrganizations(session.user.id);
      } else {
        setProfile(null);
        setOrganizations([]);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isOrganizerAnywhere = organizations.some((org) => org.role === "organizer");

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organizations,
        isOrganizerAnywhere,
        isLoading,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
