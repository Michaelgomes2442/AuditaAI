import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
    retries: 2,
  use: {
    // Allow overriding the base URL for local testing by setting PLAYWRIGHT_BASE_URL.
    // Defaults to the deployed production URL when not set.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://auditaai.vercel.app',
    trace: 'on-first-retry',
    // `slowMo` belongs under `launchOptions` per Playwright types.
    launchOptions: {
      slowMo: 500,
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer needed for live deployment testing
});