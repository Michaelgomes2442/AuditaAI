import { setupPrismaOptimize } from './e2e/prisma-optimize-setup';

// Global setup for Playwright E2E tests
async function globalSetup() {
  console.log('🚀 Setting up E2E tests with Prisma query monitoring...');
  setupPrismaOptimize();
  console.log('✅ Global setup complete');
}

export default globalSetup;