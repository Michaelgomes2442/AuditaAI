export const appRoutes = {
  home: () => '/',
  auth: {
    signin: () => '/auth/signin',
    signup: () => '/auth/signup',
    signout: () => '/auth/signout',
  },
  dashboard: () => '/dashboard',
  logs: () => '/logs',
  settings: () => '/settings',
} as const;

// For middleware and other non-Next.js router usage
export const staticRoutes = {
  home: '/',
  auth: {
    signin: '/auth/signin',
    signup: '/auth/signup',
    signout: '/auth/signout',
  },
  dashboard: '/dashboard',
  logs: '/logs',
  settings: '/settings',
} as const;

export type AppRoutes = typeof appRoutes;
export type RouteKeys = keyof typeof appRoutes;

export function getRoute(path: keyof typeof staticRoutes | string): string {
  // Ensure the path starts with a forward slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Get all static routes for validation
  const allPaths = Object.values(staticRoutes).flatMap(route => 
    typeof route === 'string' ? route : Object.values(route)
  );
  
  if (!allPaths.includes(normalizedPath)) {
    console.warn(`Warning: Route "${normalizedPath}" is not defined in routes configuration`);
  }
  
  return normalizedPath;
}