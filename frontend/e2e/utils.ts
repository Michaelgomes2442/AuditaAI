import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'testPassword123!'
};

export const FOUNDER_USER = {
  email: 'founder@auditaai.com',
  password: 'Toby60022006!!!'
};

export const routes = {
  home: '/',
  signin: '/signin',
  signup: '/signup',
  dashboard: '/dashboard',
  logs: '/logs',
  settings: '/settings'
} as const;

export const selectors = {
  email: '#email',
  password: '#password',
  submitButton: 'button[type="submit"]',
  userMenu: '[data-testid="user-menu-trigger"]',
  logoutButton: '[data-testid="logout-button"]',
  userEmail: '[data-testid="user-email"]',
  errorMessage: '[data-testid="error-message"]'
} as const;

export async function clearSession(page: Page) {
  try {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  } catch (e) {
    // Ignore if can't access storage
  }
}

export async function createTestUser(page: Page, email?: string, password?: string) {
  const user = {
    email: email || `test-${Date.now()}@example.com`,
    password: password || `testPass${Date.now()}!`,
    name: `Test User ${Date.now()}`
  };

  await page.goto(routes.signup);
  await page.fill('input[type="text"]', user.name); // Name field
  await page.fill(selectors.email, user.email);
  await page.fill(selectors.password, user.password);
  await page.fill('input[id="confirmPassword"]', user.password); // Confirm password
  await page.click(selectors.submitButton);

  return user;
}

export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto(routes.signin);
  await page.waitForSelector(selectors.email, { timeout: 10000 });
  await page.fill(selectors.email, email);
  await page.fill(selectors.password, password);
  await page.click(selectors.submitButton);
  // Wait for navigation to home or error
  await page.waitForURL((url) => url.pathname === routes.home || url.pathname === routes.signin, { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.click(selectors.userMenu);
  await page.click(selectors.logoutButton);
}

export async function waitForUrl(page: Page, url: string) {
  await page.waitForURL(url);
}

// Helper that indicates whether the integration/backend is available for E2E.
// Set E2E_RUN_INTEGRATION=1 or provide BACKEND_INTERNAL_URL/NEXT_PUBLIC_BACKEND_URL
// in CI to run the full integration tests. Default: skip integration tests.
export function requiresBackend(): boolean {
  // Always return true for local-only development to ensure tests run
  return true;
}