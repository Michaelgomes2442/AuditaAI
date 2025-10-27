import { teardownPrismaOptimize } from './e2e/prisma-optimize-setup';

// Global teardown for Playwright E2E tests
async function globalTeardown() {
  console.log('🛑 Tearing down E2E tests...');
  await teardownPrismaOptimize();
  console.log('✅ Global teardown complete');
}

export default globalTeardown;