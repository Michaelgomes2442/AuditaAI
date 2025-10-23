# Pilot Page Issues & Navigation TODO

## Priority Issues to Fix

### 1. **User Authentication & Tier Recognition** ✅ FIXED
- [x] Profile loading state - app shows "FREE" tier before profile loads
- [x] Add loading spinner/skeleton while fetching user profile
- [x] Persist user tier in session/context to avoid re-fetching
- [x] Show correct tier immediately on page load (not after delay)
- [x] Add error handling if profile fetch fails
- [x] Cache profile data to avoid repeated API calls

**Implementation:**
- Created global `UserContext` (`/frontend/src/contexts/UserContext.tsx`)
- Added `UserProvider` to root layout
- Profile now loads once and persists across all pages
- Loading state shows "Loading..." badge while fetching
- Console logs show profile loading progress

### 2. **Navigation & Routing Issues** ✅ PARTIALLY FIXED
- [x] Home page redirect logic - authenticated users now redirect to /pilot
- [x] Redirect from signin/signup to /pilot if already authenticated
- [x] Route guards for authenticated pages via middleware
- [ ] Backspace/Browser back button behavior (needs testing)
- [ ] Add breadcrumbs for navigation context
- [ ] Fix "Back" button on pilot page
- [ ] Ensure all internal links use Next.js `<Link>` component

**Implementation:**
- Updated `/frontend/src/middleware.ts` to redirect authenticated users
- Home page (/) now redirects to /pilot for logged-in users
- signin/signup pages redirect to /pilot if already authenticated
- Protected routes still require authentication

### 3. **Demo Prompts Issues**
- [ ] Demo prompts require Ollama but don't check if it's running before attempting
- [ ] Error messages not user-friendly when Ollama fails
- [ ] No loading state on "Run Demo" button
- [ ] Modal doesn't show loading spinner while LLM is processing
- [ ] CRIES scores show "N/A" instead of proper error handling
- [ ] Cached responses not invalidated when needed
- [ ] No retry mechanism if demo fails

### 4. **Live Testing Issues** (PAID users) ✅ PARTIALLY FIXED
- [x] Model selection doesn't validate if models are available
- [x] No indication which models require API keys
- [x] Auto-select available Ollama models
- [ ] Governance toggle doesn't clearly explain what it does
- [ ] Results modal doesn't handle long responses well
- [ ] No way to save/export test results
- [ ] Can't compare more than one test run
- [ ] No history of previous tests

**Implementation:**
- Fetch available Ollama models via `/api/pilot/ollama-status`
- Auto-select installed Ollama models for PAID users
- Separate UI sections: "Ollama Models (Free, Local)" vs "Cloud Models (Require API Keys)"
- Added "Select All" / "Deselect All" button for Ollama models
- Show model count and availability status
- Warning when no models selected or Ollama not installed

### 5. **UI/UX Issues**
- [ ] Tier badge in header shows wrong tier initially
- [ ] "Upgrade" button always visible even for ARCHITECT users
- [ ] Upgrade modal needs better plan comparison
- [ ] Status indicators (Ollama Ready, BEN Runtime) confusing
- [ ] Too many status banners stacked (Ollama + Runtime)
- [ ] Mobile responsiveness needs testing
- [ ] Pricing table not aligned properly

### 6. **Performance Issues** ✅ PARTIALLY FIXED
- [x] fetchRosettaData polling reduced from 10s to 30s
- [x] Profile API call eliminated from pilot page (now uses UserContext)
- [ ] Large CRIES calculation slows down demo responses
- [ ] No request deduplication
- [ ] Consider using React Query or SWR for data fetching

**Implementation:**
- Reduced Rosetta polling interval from 10 seconds to 30 seconds
- Profile is now fetched once by UserProvider instead of on every page
- Removed duplicate profile fetch from pilot page

### 7. **Error Handling**
- [ ] No global error boundary
- [ ] API errors show raw error messages to users
- [ ] No fallback UI when things fail
- [ ] Console errors clutter logs
- [ ] Need proper error reporting/logging

### 8. **Accessibility**
- [ ] Missing ARIA labels on interactive elements
- [ ] Keyboard navigation not tested
- [ ] Focus management in modals
- [ ] Screen reader support
- [ ] Color contrast issues (dark theme)

### 9. **Security**
- [ ] API keys for OpenAI/Anthropic stored insecurely
- [ ] No rate limiting on demo prompts
- [ ] User tier not validated server-side for all endpoints
- [ ] CSRF tokens not implemented
- [ ] Session timeout handling

### 10. **Data Consistency**
- [ ] Profile state vs session state mismatch
- [ ] Tier shown in UI doesn't always match database
- [ ] Race conditions between profile load and tier check
- [ ] Need single source of truth for user data

## Navigation Flow Issues

### Home Page Redirect
- [ ] `/` should redirect to `/pilot` for authenticated users
- [ ] Unauthenticated users should see landing page
- [ ] Add middleware for route protection
- [ ] Implement proper 404 page

### Backspace/Back Button
- [ ] Browser back button doesn't work correctly
- [ ] Need to use Next.js router properly
- [ ] Check if `window.history` is being manipulated
- [ ] Ensure no `e.preventDefault()` blocking navigation
- [ ] Test back button across all pages

### Page State Persistence
- [ ] Form inputs not persisted when navigating back
- [ ] Scroll position not restored
- [ ] Modal state lost on navigation
- [ ] Need `sessionStorage` or URL state management

## Suggested Architecture Changes

### 1. Global User Context
```typescript
// Create a UserContext to manage profile across all pages
const UserContext = createContext<UserProfile | null>(null);
```

### 2. React Query Integration
```typescript
// Use React Query for all API calls
const { data: profile, isLoading } = useQuery('userProfile', fetchProfile);
```

### 3. Server-Side Auth Check
```typescript
// Add getServerSideProps to check auth before rendering
export async function getServerSideProps(context) {
  const session = await getServerSession(context, authOptions);
  if (!session) return { redirect: { destination: '/signin' } };
  return { props: { user: session.user } };
}
```

### 4. Route Middleware
```typescript
// middleware.ts to protect routes
export function middleware(request: NextRequest) {
  const session = request.cookies.get('next-auth.session-token');
  if (!session && request.nextUrl.pathname.startsWith('/pilot')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}
```

## Testing Checklist

- [ ] Test as FREE user (no features should break)
- [ ] Test as PAID user (live testing should work)
- [ ] Test as ARCHITECT user (all features available)
- [ ] Test with Ollama running
- [ ] Test with Ollama NOT running
- [ ] Test with invalid API keys
- [ ] Test on mobile devices
- [ ] Test with slow network connection
- [ ] Test browser back/forward buttons
- [ ] Test refresh page (state should persist)

## Priority Order

1. **CRITICAL** - Fix user tier recognition (profile loading)
2. **CRITICAL** - Fix navigation/back button
3. **HIGH** - Ollama error handling and setup guidance
4. **HIGH** - Loading states for all async operations
5. **MEDIUM** - Performance optimization (reduce API calls)
6. **MEDIUM** - Better error messages
7. **LOW** - UI polish and accessibility
8. **LOW** - Additional features (export, history)

## Next Steps

1. Create global `UserProvider` context
2. Add React Query or SWR for data fetching
3. Implement proper middleware for route protection
4. Fix back button by ensuring proper Next.js routing
5. Add loading skeletons everywhere
6. Comprehensive error boundary
7. Test all user flows end-to-end
