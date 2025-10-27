import { defineConfig, devices } from '@playwright/test';
import { setupPrismaOptimize, teardownPrismaOptimize } from './e2e/prisma-optimize-setup';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true, // Changed back to true for parallel execution
  forbidOnly: !!process.env.CI,
  workers: 6, // Changed back to 6 for parallel execution
  reporter: [
    ['../terminal-reporter.js'], // Custom terminal reporter
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  retries: 0, // Changed to 0 to avoid retries that hide the real issue

  // Global setup for Prisma Optimize
  globalSetup: './playwright-global-setup.ts',

  // Global teardown for Prisma Optimize
  globalTeardown: './playwright-global-teardown.ts',

  use: {
    // Allow overriding the base URL for local testing by setting PLAYWRIGHT_BASE_URL.
    // Defaults to the deployed production URL when not set.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    // `slowMo` belongs under `launchOptions` per Playwright types.
    launchOptions: {
      slowMo: 0, // Removed slowMo for headless
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
  webServer: [
    {
      command: 'cd ../backend && pnpm start',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});