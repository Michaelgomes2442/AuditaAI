import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFounderAccounts() {
  try {
    console.log('Creating founder accounts...');

    // Create Michael Gomes founder account
    const founderPassword = await bcrypt.hash('Toby60022006!!!', 10);
    const founder = await prisma.user.upsert({
      where: { email: 'founder@auditaai.com' },
      update: {},
      create: {
        email: 'founder@auditaai.com',
        password: founderPassword,
        name: 'Michael Gomes',
        role: 'ARCHITECT',
        tier: 'ARCHITECT',
        status: 'ACTIVE'
      }
    });

    // Create Tristan's paid account
    const tristanPassword = await bcrypt.hash('changeme', 10);
    const tristan = await prisma.user.upsert({
      where: { email: 'tristanbarbaste@gmail.com' },
      update: {
        password: tristanPassword,
        name: 'Tristan',
        role: 'ADMIN',
        tier: 'PAID',
        status: 'ACTIVE'
      },
      create: {
        email: 'tristanbarbaste@gmail.com',
        password: tristanPassword,
        name: 'Tristan',
        role: 'ADMIN',
        tier: 'PAID',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Founder accounts created successfully!');
    console.log('Founder:', founder.email, '- Password: Toby60022006!!!');
    console.log('Tristan:', tristan.email, '- Password: changeme');

  } catch (error) {
    console.error('❌ Error creating founder accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFounderAccounts();