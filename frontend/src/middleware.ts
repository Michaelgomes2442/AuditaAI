import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';

// Create the i18n middleware
const i18nMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localeDetection: true
});

// Tier hierarchy (higher number = more permissions)
const TIER_HIERARCHY = {
  FREE: 0,
  PAID: 1,
  ARCHITECT: 2
};

// Feature access matrix
const FEATURE_ACCESS = {
  '/api/live-demo/parallel-prompt': ['PAID', 'ARCHITECT'], // Live testing
  '/api/rosetta/boot': ['PAID', 'ARCHITECT'], // Rosetta boot
  '/api/rosetta/sessions': ['ARCHITECT'], // Manual Rosetta control
  '/api/ben/persona': ['ARCHITECT'], // Persona switching
  '/api/audit-logs/export': ['PAID', 'ARCHITECT'], // Export logs
  '/api/webhooks': ['PAID', 'ARCHITECT'], // Webhook management
  '/api/cost-analysis': ['PAID', 'ARCHITECT'], // Cost analytics
  '/api/templates': ['FREE', 'PAID', 'ARCHITECT'], // Test templates (all tiers)
  '/api/regression': ['PAID', 'ARCHITECT'], // Regression testing
  '/pilot': ['FREE', 'PAID', 'ARCHITECT'], // Pilot dashboard (all tiers)
  '/demo': ['FREE', 'PAID', 'ARCHITECT'] // Demo mode (all tiers)
};

// List of public routes that don't require authentication
const publicRoutes = [
  '/',
  '/docs',
  '/about',
  '/api',
  '/get-started',
  '/signin',
  '/signup',
  '/signout',
  '/ben-runtime',  // BEN Runtime dashboard
];

// Protected routes that require authentication
const protectedRoutes = [
  '/pilot',
  '/pilot-info',
  '/live-demo',
  '/lab',
  '/dashboard',
  '/logs',
  '/settings',
  '/profile',
  '/demo',
];

// Admin-only routes
const adminRoutes = [
  '/dev',
  '/admin',
  '/api/dev',
  '/api/admin'
];

export default async function middleware(request: NextRequest) {
  // First, handle i18n routing
  const i18nResponse = i18nMiddleware(request);
  if (i18nResponse && i18nResponse.status !== 200) {
    return i18nResponse;
  }

  // Continue with existing auth logic
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Tier-based access control for API routes
  if (pathname.startsWith('/api/')) {
    const userTier = request.headers.get('x-user-tier') as keyof typeof TIER_HIERARCHY || 'FREE';

    // Find matching feature access rule
    const requiredTiers = Object.entries(FEATURE_ACCESS).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (requiredTiers && !requiredTiers.includes(userTier)) {
      console.log(`🚫 Access denied: ${userTier} user attempted to access ${pathname}`);
      console.log(`   Required tiers: ${requiredTiers.join(', ')}`);

      return NextResponse.json(
        {
          error: 'Tier upgrade required',
          message: `This feature requires ${requiredTiers[0]} tier or higher. Current tier: ${userTier}`,
          requiredTier: requiredTiers[0],
          currentTier: userTier,
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    // Rate limiting by tier
    const rateLimits = {
      FREE: 10,      // 10 requests/hour
      PAID: 1000,    // 1000 requests/hour
      ARCHITECT: -1  // Unlimited
    };

    // Add tier info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-tier-level', String(TIER_HIERARCHY[userTier]));
    requestHeaders.set('x-rate-limit', String(rateLimits[userTier]));

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  // Get auth token (check both production and development cookie names)
  const token = request.cookies.get('next-auth.session-token') ||
                request.cookies.get('__Secure-next-auth.session-token');

  // Redirect authenticated users from signin/signup to home
  if ((pathname === '/signin' || pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access to public routes and their sub-paths
  if (publicRoutes.includes(pathname) ||
      pathname.startsWith('/docs') ||
      pathname.startsWith('/about') ||
      pathname.startsWith('/get-started') ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/ben-runtime') ||  // Allow BEN Runtime dashboard
      pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));

  if (requiresAuth) {
    if (!token) {
      // Redirect to signin if no token is present
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // For admin routes, verify admin role
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      // No token, redirect to signin
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    try {
      const response = await fetch(`${request.nextUrl.origin}/api/auth/check-admin`, {
        headers: {
          Cookie: `next-auth.session-token=${token.value}`,
        },
      });

      if (!response.ok) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};