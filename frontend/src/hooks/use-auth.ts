import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { appRoutes } from '@/lib/routes';

export function useAuth(requireAdmin = false) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(appRoutes.auth.signin() as any);
      } else if (requireAdmin && !isAdmin) {
        router.push(appRoutes.dashboard() as any);
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, router]);

  return {
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    user: session?.user
  };
}

export function useRequireAuth(requireAdmin = false) {
  const auth = useAuth(requireAdmin);

  if (auth.isLoading) {
    return { isLoading: true };
  }

  if (!auth.isAuthenticated || (requireAdmin && !auth.isAdmin)) {
    return null;
  }

  return auth;
}

export function useRedirectIfAuthenticated(redirectTo = appRoutes.dashboard()) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(redirectTo as any);
    }
  }, [status, redirectTo, router]);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session
  };
}