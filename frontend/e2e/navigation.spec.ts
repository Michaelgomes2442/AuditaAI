import { test, expect } from '@playwright/test';
import { createTestUser, loginAsUser, routes, selectors, requiresBackend } from './utils';

test.skip(!requiresBackend(), 'integration backend not available — skipping navigation tests');

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Create and login as a test user before each test
    const user = await createTestUser(page);
    await loginAsUser(page, user.email, user.password);
    await expect(page).toHaveURL(routes.dashboard);
  });

  test('should show correct navigation items when authenticated', async ({ page }) => {
    // Check navbar elements
    await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
    await expect(page.locator('text=Audita AI')).toBeVisible();
    
    // Open user menu and check items
    await page.click('[data-testid="user-menu-trigger"]');
    await expect(page.locator('[data-testid="settings-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
  });

  test('should navigate between pages correctly', async ({ page }) => {
    // Test navigation to Logs
    await page.goto(routes.logs);
    await expect(page).toHaveURL(routes.logs);
    await expect(page.locator('h1')).toContainText('Audit Logs');

    // Test navigation to Settings
    await page.click('[data-testid="user-menu-trigger"]');
    await page.click('[data-testid="settings-link"]');
    await expect(page).toHaveURL(routes.settings);
    await expect(page.locator('h1')).toContainText('Settings');

    // Test navigation to Dashboard
    await page.goto(routes.dashboard);
    await expect(page).toHaveURL(routes.dashboard);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should maintain navigation state across page reloads', async ({ page }) => {
    // Navigate to logs page
    await page.goto(routes.logs);
    await expect(page).toHaveURL(routes.logs);

    // Reload the page
    await page.reload();
    
    // Should still be on logs page and authenticated
    await expect(page).toHaveURL(routes.logs);
    await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
  });

  test('should handle unauthorized access attempts', async ({ page }) => {
    // Log out
    await page.click('[data-testid="user-menu-trigger"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(routes.home);

    // Try accessing protected routes
    await page.goto(routes.logs);
    await expect(page).toHaveURL(routes.signin);

    await page.goto(routes.settings);
    await expect(page).toHaveURL(routes.signin);
  });
});