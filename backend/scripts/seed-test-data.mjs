#!/usr/bin/env node

/**
 * Seed test audit records for frontend tests
 */

import { PrismaClient } from '../../frontend/src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Seeding test audit records...');

    // Get the founder user
    const founder = await prisma.user.findUnique({
      where: { email: 'founder@auditaai.com' }
    });

    if (!founder) {
      console.log('⚠️ Founder not found, skipping seed');
      return;
    }

    // Create some test audit records
    const testRecords = [
      {
        action: 'USER_LOGIN',
        category: 'AUTH',
        details: 'User logged into dashboard',
        userId: founder.id,
        status: 'SUCCESS'
      },
      {
        action: 'MODEL_ANALYSIS',
        category: 'VERIFICATION',
        details: 'Analyzed GPT-4 response for compliance',
        userId: founder.id,
        status: 'SUCCESS'
      },
      {
        action: 'RECEIPT_GENERATED',
        category: 'DATA',
        details: 'Generated Δ-Receipt for analysis',
        userId: founder.id,
        status: 'SUCCESS'
      },
      {
        action: 'EXPORT_DATA',
        category: 'DATA',
        details: 'Exported audit logs to CSV',
        userId: founder.id,
        status: 'SUCCESS'
      },
      {
        action: 'SYSTEM_CHECK',
        category: 'SYSTEM',
        details: 'Performed routine system health check',
        userId: founder.id,
        status: 'SUCCESS'
      }
    ];

    for (let i = 0; i < testRecords.length; i++) {
      const rec = testRecords[i];
      const detailsJson = JSON.stringify(rec.details || {});
      const metadataJson = JSON.stringify(rec.metadata || {});
      // Safely escape single quotes for raw string construction
      const esc = (s) => String(s).replace(/'/g, "''");
      const sql = `INSERT INTO "AuditRecord" ("userId", action, category, details, metadata, status, lamport, "createdAt", "updatedAt") VALUES (${rec.userId}, '${esc(rec.action)}', '${esc(rec.category)}'::"AuditCategory", '${esc(detailsJson)}'::jsonb, '${esc(metadataJson)}'::jsonb, '${esc(rec.status)}'::"AuditStatus", ${1000 + i}, now(), now())`;
      // Use unsafe raw execution because we need explicit enum casts in SQL.
      await prisma.$executeRawUnsafe(sql);
    }

    console.log(`✅ Seeded ${testRecords.length} test audit records`);
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();