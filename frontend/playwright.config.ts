import { defineConfig, devices } from '@playwright/test';
import { setupPrismaOptimize, teardownPrismaOptimize } from './e2e/prisma-optimize-setup';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Changed to false for sequential execution to avoid test interference
  forbidOnly: !!process.env.CI,
  workers: 1, // Changed to 1 for sequential execution
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
    headless: false, // Enable headed mode for debugging frontend issues
    // `slowMo` belongs under `launchOptions` per Playwright types.
    launchOptions: {
      slowMo: 0, // Removed slowMo for headed mode
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  // Web servers are started manually, not by Playwright
  // webServer: [
  //   {
  //     command: 'cd ../backend && pnpm start',
  //     port: 3001,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: true,
  //   },
  //   {
  //     command: 'pnpm dev',
  //     port: 3000,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: true,
  //   },
  // ],
});