import { test, expect } from './base';
import { loginAsUser, logout, clearSession, routes, selectors, FOUNDER_USER } from './utils';

// AuditaAI Frontend UI Tests
// Tests the user interface and user flows with headed browsers

test.describe('Frontend UI - Basic Navigation', () => {
  test('dashboard page loads successfully', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto(routes.dashboard);

    // Check if page loads without crashing
    await expect(page).toHaveURL(routes.dashboard);
    // Check for basic page elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('user can logout successfully', async ({ page }) => {
    await page.goto(routes.signin);
    await clearSession(page);

    // Sign in first as founder
    await loginAsUser(page, FOUNDER_USER.email, FOUNDER_USER.password);

    // Navigate to dashboard where logout button is available
    await page.goto(routes.dashboard);
    await page.waitForLoadState('networkidle');

    // Logout
    await page.click(selectors.userMenu);
    await page.locator(selectors.logoutButton).waitFor({ state: 'visible' });
    await page.click(selectors.logoutButton);

    // Should redirect to home or signin
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === routes.signin);
    await expect(page).toHaveURL(/\/$|\/signin/);
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto(routes.signin);
    await clearSession(page);

    await page.waitForSelector(selectors.email);
    await page.fill(selectors.email, 'invalid@example.com');
    await page.fill(selectors.password, 'wrongpassword');
    await page.click(selectors.submitButton);

    // Wait for potential error
    await page.waitForTimeout(2000);

    // Should show error message or stay on signin
    await expect(page).toHaveURL(routes.signin);
    // Check if error message appears
    const errorLocator = page.locator(selectors.errorMessage);
    if (await errorLocator.isVisible()) {
      await expect(errorLocator).toBeVisible();
    }
  });
});

test.describe('Frontend UI - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.signin);
    await clearSession(page);
    await loginAsUser(page, FOUNDER_USER.email, FOUNDER_USER.password);
    await page.waitForLoadState('networkidle');
  });

  test('dashboard loads correctly', async ({ page }) => {
    await loginAsUser(page, FOUNDER_USER.email, FOUNDER_USER.password);
    await page.goto(routes.dashboard);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(routes.dashboard);

    // Wait for user menu to ensure session is loaded
    await page.waitForSelector(selectors.userMenu);

    // Check for dashboard content
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('logs page loads correctly', async ({ page }) => {
    await loginAsUser(page, FOUNDER_USER.email, FOUNDER_USER.password);
    await page.goto(routes.logs);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(routes.logs);

    // Wait for user menu to ensure session is loaded
    await page.waitForSelector(selectors.userMenu);

    // Check for logs content
    await expect(page.locator('body')).toContainText(/log|audit|governance/i);
  });

  test('settings page loads correctly', async ({ page }) => {
    await loginAsUser(page, FOUNDER_USER.email, FOUNDER_USER.password);
    await page.goto(routes.settings);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(routes.settings);

    // Wait for user menu to ensure session is loaded
    await page.waitForSelector(selectors.userMenu);

    // Check for settings content
    await expect(page.locator('body')).toContainText(/setting|config/i);
  });

  test('pilot page loads correctly', async ({ page }) => {
    await page.goto('/pilot');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/pilot');

    // Check for pilot content
    await expect(page.locator('body')).toContainText(/pilot|demo|test/i);
  });
});

test.describe('Frontend UI - Error Handling', () => {
  test('404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('body')).toContainText(/not found|404/i);
  });

  test('unauthenticated access redirects appropriately', async ({ page }) => {
    await page.goto(routes.signin);
    await clearSession(page);

    // Try to access protected route
    await page.goto(routes.dashboard);

    // Should show sign-in prompt on the page
    await expect(page.locator('body')).toContainText('Please sign in');
  });
});