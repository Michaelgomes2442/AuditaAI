import { test, expect } from '@playwright/test';

const CLAUDE_API_KEY = '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';

test.describe('Pilot Page - Claude API Key Flow', () => {
  test('User loads 2+2, receives result, and triggers export/upload', async ({ page }) => {
    await page.goto('/pilot');

    // Enter Claude API key
    await page.fill('input[name="apiKey"]', CLAUDE_API_KEY);
    await page.click('button:has-text("Register API Key")');

    // Enter prompt "2+2"
    await page.fill('textarea[name="prompt"]', '2+2');
    await page.click('button:has-text("Send")');

    // Wait for result
    await expect(page.locator('.result')).toContainText('4');

    // Trigger export/upload
    await page.click('button:has-text("Export/Upload Result")');

    // Check for downloadable HTML file link
    await expect(page.locator('a:has-text("Download HTML")')).toBeVisible();

    // Optionally, check for upload confirmation
    await expect(page.locator('.upload-success')).toBeVisible();
  });
});
