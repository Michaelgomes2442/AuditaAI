/**
 * AuditaAI Founder Account Creator
 * Run with: npx tsx scripts/create-founder.ts
 */

import { PrismaClient, Permission } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFounderAccount() {
  try {
    console.log('🚀 AuditaAI Founder Account Creator\n');

    const founderData = {
      email: 'founder@auditaai.com',
      password: 'Toby60022006!!!',
      name: 'Michael Tobin Gomes (Founder)',
      role: 'ARCHITECT' as const, // Highest role - can modify system configuration
      permissions: [
        Permission.READ_LOGS,
        Permission.WRITE_LOGS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_TEAMS,
        Permission.VERIFY_RECORDS,
        Permission.EXPORT_DATA,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_SETTINGS
      ],
      status: 'ACTIVE' as const
    };

    // Check if founder already exists
    console.log('🔍 Checking for existing founder account...');
    const existing = await prisma.user.findUnique({
      where: { email: founderData.email }
    });

    if (existing) {
      console.log('⚠️  Founder account already exists. Deleting old account...');
      await prisma.user.delete({
        where: { email: founderData.email }
      });
      console.log('✅ Old account deleted.\n');
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(founderData.password, 10);
    console.log('✅ Password hashed successfully.\n');

    // Create the founder account
    console.log('👤 Creating founder account...');
    const founder = await prisma.user.create({
      data: {
        email: founderData.email,
        password: hashedPassword,
        name: founderData.name,
        role: founderData.role,
        permissions: founderData.permissions,
        status: founderData.status
      }
    });

    console.log('✅ Founder account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:          ${founder.id}`);
    console.log(`Email:       ${founder.email}`);
    console.log(`Name:        ${founder.name}`);
    console.log(`Role:        ${founder.role}`);
    console.log(`Permissions: ${founder.permissions.join(', ')}`);
    console.log(`Status:      ${founder.status}`);
    console.log(`Created:     ${founder.createdAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 You can now sign in with:');
    console.log(`   Email:    ${founderData.email}`);
    console.log(`   Password: ${founderData.password}`);
  const FRONTEND_BASE = process.env.FRONTEND_BASE || process.env.BASE || 'http://localhost:3004';
  console.log(`\n🔗 Sign in at: ${FRONTEND_BASE.replace(/\/$/, '')}/signin\n`);

  } catch (error) {
    console.error('❌ Error creating founder account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createFounderAccount();
