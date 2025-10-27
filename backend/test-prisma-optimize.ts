#!/usr/bin/env node

/**
 * Test script to verify Prisma query monitoring integration
 * Run with: node test-prisma-optimize.mjs
 */

import { config } from 'dotenv';
import { createOptimizedPrismaClient } from './src/prisma-optimize.ts';

// Load environment variables
config();

async function testPrismaOptimize() {
  console.log('🧪 Testing Prisma query monitoring integration...\n');

  const prisma = await createOptimizedPrismaClient();

  try {
    // Test basic connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test a simple query (adjust based on your schema)
    console.log('🔍 Testing query monitoring...');
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);

    // Test another query to see monitoring in action
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, createdAt: true }
    });

    console.log('📋 Recent users:');
    recentUsers.forEach(user => {
      console.log(`   - ${user.email} (created: ${user.createdAt})`);
    });

    console.log('\n✅ Prisma query monitoring test completed successfully!');
    console.log('💡 Check the console output above for query monitoring logs');

  } catch (error) {
    console.error('❌ Prisma query monitoring test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPrismaOptimize().catch(console.error);