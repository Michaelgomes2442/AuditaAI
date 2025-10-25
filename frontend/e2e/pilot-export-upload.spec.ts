import { test, expect } from '@playwright/test';
import { requiresBackend } from './utils';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Skip the file unless integration backend is available and the CLAUDE API key is set.
test.skip(!requiresBackend(), 'integration backend not available — skipping');
test.skip(!CLAUDE_API_KEY, 'CLAUDE_API_KEY not set — skipping Claude-specific tests');

test.describe('Pilot Page - Claude API Key Flow', () => {
  test('User loads 2+2, receives result, and triggers export/upload', async ({ page }) => {
    await page.goto('/pilot');

  // Enter Claude API key
  await page.fill('input[name="apiKey"]', CLAUDE_API_KEY!);
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
