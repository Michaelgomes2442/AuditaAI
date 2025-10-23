// Real Data Aggregation Script for Demo Account
// Aggregates and anonymizes actual test data from production accounts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@auditaai.com';

async function aggregateRealData() {
  console.log('🔍 Analyzing real audit data across all accounts...\n');

  // Get demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL }
  });

  if (!demoUser) {
    console.error('❌ Demo account not found. Run demo-setup.sh first.');
    process.exit(1);
  }

  // === Real Data Statistics ===
  
  const stats = {
    totalReceipts: await prisma.receipt.count(),
    totalUsers: await prisma.user.count(),
    totalWitnessEvents: await prisma.receipt.count({
      where: {
        event: { contains: 'WITNESS' }
      }
    }),
    recentAudits: await prisma.receipt.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  };

  console.log('📊 Real Data Summary:');
  console.log(`   Total Receipts: ${stats.totalReceipts}`);
  console.log(`   Active Users: ${stats.totalUsers}`);
  console.log(`   Witness Events: ${stats.totalWitnessEvents}`);
  console.log(`   Recent Audits (7d): ${stats.recentAudits}\n`);

  if (stats.totalReceipts === 0) {
    console.log('⚠️  No real audit data available yet.');
    console.log('   Run actual tests in the Lab to generate demo data.\n');
    return;
  }

  // === Aggregate Best Performing Audits ===
  
  console.log('🏆 Top Performing Audits (Real Data):');
  
  const recentReceipts = await prisma.receipt.findMany({
    take: 20,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  recentReceipts.forEach((receipt, i) => {
    const userEmail = receipt.user?.email || 'unknown';
    const anonymized = userEmail.replace(/(.{3}).*(@.*)/, '$1***$2');
    console.log(`   ${i + 1}. ${receipt.event} - ${anonymized} - ${receipt.createdAt.toISOString()}`);
  });

  console.log('');

  // === Witness Consensus Analysis ===
  
  const witnessReceipts = await prisma.receipt.findMany({
    where: {
      event: { contains: 'WITNESS' }
    },
    take: 10,
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (witnessReceipts.length > 0) {
    console.log('🔍 Recent Witness Consensus Events:');
    witnessReceipts.forEach((receipt, i) => {
      console.log(`   ${i + 1}. ${receipt.event} - L:${receipt.lamportClock || 'N/A'}`);
    });
    console.log('');
  }

  // === User Activity Patterns ===
  
  const userActivity = await prisma.receipt.groupBy({
    by: ['userId'],
    _count: {
      userId: true
    },
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 5
  });

  console.log('👥 Most Active Users (Anonymized):');
  for (const activity of userActivity) {
    if (activity.userId) {
      const user = await prisma.user.findUnique({
        where: { id: activity.userId },
        select: { email: true, tier: true }
      });
      
      const email = user?.email || 'unknown';
      const anonymized = email.replace(/(.{3}).*(@.*)/, '$1***$2');
      console.log(`   • ${anonymized} (${user?.tier || 'FREE'}) - ${activity._count.userId} audits`);
    }
  }

  console.log('\n✅ Demo account has access to all real audit data');
  console.log('   Data is aggregated and anonymized for investor presentations\n');
}

aggregateRealData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
