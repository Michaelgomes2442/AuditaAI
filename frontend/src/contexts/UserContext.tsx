'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  tier: 'FREE' | 'PAID' | 'ARCHITECT';
  role?: string;
  permissions?: any;
  status?: string;
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetchProfile: () => Promise<void>;
  isFree: boolean;
  isPaid: boolean;
  isArchitect: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (status === 'loading') {
      return; // Wait for session to load
    }

    if (!session?.user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 [UserProvider] Fetching user profile...');
      
      const res = await fetch('/api/user/profile');
      
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ [UserProvider] Profile loaded:', {
        email: data.email,
        tier: data.tier,
        role: data.role
      });
      
      setProfile({
        id: data.id,
        email: data.email,
        name: data.name,
        tier: data.tier || 'FREE',
        role: data.role,
        permissions: data.permissions,
        status: data.status
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('❌ [UserProvider] Error:', errorMsg);
      setError(errorMsg);
      // Set default FREE tier on error
      setProfile({ tier: 'FREE' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session, status]);

  // Compute derived values
  const isFree = !profile?.tier || profile.tier === 'FREE';
  const isPaid = profile?.tier === 'PAID';
  const isArchitect = profile?.tier === 'ARCHITECT' || profile?.role === 'ARCHITECT' || profile?.role === 'ADMIN';

  // Log tier changes
  useEffect(() => {
    if (profile && !isLoading) {
      console.log('👤 [UserProvider] User tier:', {
        tier: profile.tier,
        role: profile.role,
        isFree,
        isPaid,
        isArchitect
      });
    }
  }, [profile, isLoading, isFree, isPaid, isArchitect]);

  return (
    <UserContext.Provider
      value={{
        profile,
        isLoading,
        error,
        refetchProfile: fetchProfile,
        isFree,
        isPaid,
        isArchitect
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
