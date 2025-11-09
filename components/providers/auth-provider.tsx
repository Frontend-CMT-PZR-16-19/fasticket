// Global authentication provider
// Provides user state and organization memberships across the app

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getUserOrganizations } from '@/lib/auth/permissions';
import type { OrganizationMembershipInfo } from '@/types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  organizations: OrganizationMembershipInfo[];
  isOrganizerAnywhere: boolean;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  organizations: [],
  isOrganizerAnywhere: false,
  refreshOrganizations: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<
    OrganizationMembershipInfo[]
  >([]);
  const supabase = createClient();

  const loadOrganizations = async (userId: string) => {
    const orgs = await getUserOrganizations(userId);
    setOrganizations(orgs);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadOrganizations(user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadOrganizations(session.user.id);
      } else {
        setOrganizations([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isOrganizerAnywhere = organizations.some(
    (org) => org.role === 'organizer'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        organizations,
        isOrganizerAnywhere,
        refreshOrganizations: () =>
          user ? loadOrganizations(user.id) : Promise.resolve(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
