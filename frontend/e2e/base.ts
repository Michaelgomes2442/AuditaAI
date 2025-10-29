import { test as base, expect } from '@playwright/test';
import { execSync } from 'child_process';

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
    // Database is set up once in global setup and persists for all tests
    // No reset needed for UI tests to maintain founder account
  }
});