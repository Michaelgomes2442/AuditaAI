import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Test fixtures and utilities
const generateTestEmail = () => `test-${Date.now()}@example.com`;
const generateTestPassword = () => `testPass${Date.now()}!`;

async function signup(page: Page, email: string, password: string) {
  await page.goto('/signup');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

async function signin(page: Page, email: string, password: string) {
  await page.goto('/signin');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

async function logout(page: Page) {
  await page.click('[data-testid="user-menu-trigger"]');
  await page.click('[data-testid="logout-button"]');
}

test.describe('Authentication Flow', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async () => {
    testEmail = generateTestEmail();
    testPassword = generateTestPassword();
  });

  test('should allow new user registration', async ({ page }) => {
    await signup(page, testEmail, testPassword);
    
    // Verify successful signup
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-email"]')).toContainText(testEmail);
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // First signup
    await signup(page, testEmail, testPassword);
    await logout(page);

    // Attempt duplicate signup
    await signup(page, testEmail, testPassword);
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('already exists');
  });

  test('should handle invalid credentials during signin', async ({ page }) => {
    await signin(page, testEmail, 'wrongpassword');
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid credentials');
  });

  test('should maintain authentication across navigation', async ({ page }) => {
    // Sign in
    await signin(page, testEmail, testPassword);
    await expect(page).toHaveURL('/dashboard');

    // Navigate to different pages
    await page.goto('/logs');
    await expect(page).toHaveURL('/logs');
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();

    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    // Sign in
    await signin(page, testEmail, testPassword);
    
    // Simulate session expiry by clearing storage
    await page.evaluate(() => window.localStorage.clear());
    await page.evaluate(() => window.sessionStorage.clear());
    
    // Try accessing protected route
    await page.goto('/logs');
    await expect(page).toHaveURL('/signin');
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    // Attempt to access protected routes directly
    await page.goto('/logs');
    await expect(page).toHaveURL('/signin');

    await page.goto('/settings');
    await expect(page).toHaveURL('/signin');

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/signin');
  });

  test('should clear session data on logout', async ({ page }) => {
    // Sign in
    await signin(page, testEmail, testPassword);
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await logout(page);
    
    // Verify redirect to home
    await expect(page).toHaveURL('/');
    
    // Verify cannot access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/signin');
  });
});