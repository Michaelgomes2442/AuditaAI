import { test, expect } from '@playwright/test';
import { createTestUser, loginAsUser, routes } from './utils';

test.describe('Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    // Create and login as test user
    const user = await createTestUser(page);
    await loginAsUser(page, user.email, user.password);
    await page.goto(routes.logs);
  });

  test('should display logs with filtering options', async ({ page }) => {
    // Wait for logs to load
    await expect(page.locator('[data-testid="log-entry"]').first()).toBeVisible();

    // Check filter components are present
    await expect(page.locator('[data-testid="user-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-type-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
  });

  test('should filter logs by user', async ({ page }) => {
    // Select a specific user from filter
    await page.locator('[data-testid="user-filter"]').click();
    await page.locator('text=michaelgomes').click();

    // Check that logs are filtered
    await expect(page.locator('[data-testid="log-entry"]')).toContainText('michaelgomes');
  });

  test('should filter logs by event type', async ({ page }) => {
    // Select a specific event type
    await page.locator('[data-testid="event-type-filter"]').click();
    await page.locator('text=Authentication').click();

    // Check that logs are filtered
    await expect(page.locator('[data-testid="log-entry"]')).toContainText('Authentication');
  });

  test('should filter logs by date range', async ({ page }) => {
    // Open date range picker
    await page.locator('[data-testid="date-range-filter"]').click();
    
    // Select start date (today)
    await page.locator('[data-testid="date-picker-trigger"]').first().click();
    await page.locator('text=20').click(); // Current date
    
    // Check that logs are filtered
    await expect(page.locator('[data-testid="log-entry"]')).toBeVisible();
  });

  test('should handle infinite scroll', async ({ page }) => {
    // Get initial number of logs
    const initialLogCount = await page.locator('[data-testid="log-entry"]').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for more logs to load
    await expect(async () => {
      const newLogCount = await page.locator('[data-testid="log-entry"]').count();
      expect(newLogCount).toBeGreaterThan(initialLogCount);
    }).toPass();
  });

  test('should show loading states when fetching logs', async ({ page }) => {
    // Reload page to trigger loading state
    await page.reload();

    // Check loading skeleton is visible
    await expect(page.locator('[data-testid="log-skeleton"]')).toBeVisible();

    // Wait for content to load
    await expect(page.locator('[data-testid="log-entry"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="log-skeleton"]')).not.toBeVisible();
  });

  test('should export logs', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-button"]').click();
    const download = await downloadPromise;

    // Verify download started
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should show real-time updates', async ({ page }) => {
    // Get initial log count
    const initialLogCount = await page.locator('[data-testid="log-entry"]').count();

    // Trigger a new log entry (you'll need to implement this based on your backend)
    await page.evaluate(() => {
      fetch('/api/test/create-log', { method: 'POST' });
    });

    // Wait for new log to appear
    await expect(async () => {
      const newLogCount = await page.locator('[data-testid="log-entry"]').count();
      expect(newLogCount).toBe(initialLogCount + 1);
    }).toPass();
  });
});