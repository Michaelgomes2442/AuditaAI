import { setupPrismaOptimize } from './e2e/prisma-optimize-setup';
import { execSync } from 'child_process';

// Global setup for Playwright E2E tests
async function globalSetup() {
  console.log('🚀 Setting up E2E tests with Prisma query monitoring...');

  const skipDbSetup = process.env.SKIP_DB_SETUP === 'true';
  console.log(`Database setup: ${skipDbSetup ? 'SKIPPED' : 'ENABLED'}`);

  // Always ensure founder account exists, even with SKIP_DB_SETUP
  try {
    console.log('👤 Ensuring founder account exists (idempotent)...');
    const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || 'postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require';
    execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" node scripts/create-founder-account.mjs`, { stdio: 'inherit' });
  } catch (seedErr) {
    console.warn('⚠️  create-founder-account failed (continuing):', String(seedErr));
  }

  if (!skipDbSetup) {
    try {
      // Set up database for testing (non-destructive, idempotent)
      console.log('🔍 Setting up test database (idempotent)...');
      const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || 'postgres://602197f00e8365db70a65c273a252d29dd8416ebc9aa13b39a924676dded4798:sk_akl0dJE2gxNBiZqFNZb-g@db.prisma.io:5432/postgres?sslmode=require';

      // Apply schema non-destructively
      try {
        console.log('⬆️  Applying schema with prisma db push (non-destructive)...');
        execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" npx prisma db push`, { stdio: 'inherit' });
      } catch (pushErr) {
        console.warn('⚠️  prisma db push failed (continuing):', String(pushErr));
      }

      // Ensure founder account exists using the idempotent script (create or update)
      try {
        console.log('� Ensuring founder account exists (idempotent)...');
        execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" node scripts/create-founder-account.mjs`, { stdio: 'inherit' });
      } catch (seedErr) {
        console.warn('⚠️  create-founder-account script failed (continuing):', String(seedErr));
      }

      // Optionally run test-data seeding if available
      try {
        console.log('🧪 Seeding test data (optional)...');
        execSync(`cd ../backend && DATABASE_URL="${databaseUrl}" node scripts/seed-test-data.mjs`, { stdio: 'inherit' });
      } catch (seedErr) {
        console.warn('⚠️  seed-test-data script not found or failed (continuing):', String(seedErr));
      }

      console.log('✅ Database setup complete (or skipped non-fatal errors)');
    } catch (error) {
      // Log errors but do not throw: keep Playwright runs from being aborted by transient DB issues.
      console.error('❌ Database setup encountered an error (continuing):', String(error));
    }
  }

  // Set up Prisma Optimize
  setupPrismaOptimize();
  console.log('✅ Global setup complete');
}

export default globalSetup;