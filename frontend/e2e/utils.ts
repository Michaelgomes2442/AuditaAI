import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'testPassword123!'
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
  email: 'input[type="email"]',
  password: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  userMenu: '[data-testid="user-menu-trigger"]',
  logoutButton: '[data-testid="logout-button"]',
  userEmail: '[data-testid="user-email"]',
  errorMessage: '[data-testid="error-message"]'
} as const;

export async function clearSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function createTestUser(page: Page, email?: string, password?: string) {
  const user = {
    email: email || `test-${Date.now()}@example.com`,
    password: password || `testPass${Date.now()}!`
  };

  await page.goto(routes.signup);
  await page.fill(selectors.email, user.email);
  await page.fill(selectors.password, user.password);
  await page.click(selectors.submitButton);

  return user;
}

export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto(routes.signin);
  await page.fill(selectors.email, email);
  await page.fill(selectors.password, password);
  await page.click(selectors.submitButton);
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
  return Boolean(
    process.env.E2E_RUN_INTEGRATION === '1' ||
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.MCP_SERVER_URL
  );
}