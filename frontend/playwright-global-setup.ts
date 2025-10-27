import { setupPrismaOptimize } from './e2e/prisma-optimize-setup';
import { execSync } from 'child_process';

// Global setup for Playwright E2E tests
async function globalSetup() {
  console.log('🚀 Setting up E2E tests with Prisma query monitoring...');

  const skipDbSetup = process.env.SKIP_DB_SETUP === 'true';
  console.log(`Database setup: ${skipDbSetup ? 'SKIPPED' : 'ENABLED'}`);

  if (!skipDbSetup) {
    try {
      // Set up database for testing
      console.log('🔍 Setting up test database...');
      const databaseUrl = 'postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require';

      // Run database migrations
      execSync(`DATABASE_URL="${databaseUrl}" npx prisma migrate reset --force`, { stdio: 'inherit' });
      execSync(`DATABASE_URL="${databaseUrl}" npx prisma db push`, { stdio: 'inherit' });

      // Set up backend database
      execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" npx prisma db push`, { stdio: 'inherit' });

      // Create founder account and seed data
      execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" node scripts/create-founder-account.mjs`, { stdio: 'inherit' });
      execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" node scripts/seed-test-data.mjs`, { stdio: 'inherit' });

      console.log('✅ Database setup complete');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  // Set up Prisma Optimize
  setupPrismaOptimize();
  console.log('✅ Global setup complete');
}

export default globalSetup;