import { test as base, expect } from '@playwright/test';
import { execSync } from 'child_process';

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
    // Reset database after each test for isolation
    execSync('DATABASE_URL="' + process.env.DATABASE_URL + '" npx prisma migrate reset --force', { cwd: '../backend', stdio: 'inherit' });
  }
});