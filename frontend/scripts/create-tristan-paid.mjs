import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating/updating PAID user: Tristan Barbaste...');
  
  const user = await prisma.user.upsert({
    where: { email: 'tristanbarbaste@gmail.com' },
    update: {
      password: 'changeme',
      tier: 'PAID',
      name: 'Tristan Barbaste',
      updatedAt: new Date()
    },
    create: {
      email: 'tristanbarbaste@gmail.com',
      password: 'changeme',
      name: 'Tristan Barbaste',
      role: 'USER',
      tier: 'PAID',
      permissions: [],
      status: 'ACTIVE',
      currentPersona: 'USER',
      lamportCounter: 0,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      personaLocked: false,
      backupCodes: []
    }
  });

  console.log('\n✅ User created/updated successfully:');
  console.log(JSON.stringify(user, null, 2));
  
  console.log('\n🔍 Verifying user...');
  const verified = await prisma.user.findUnique({
    where: { email: 'tristanbarbaste@gmail.com' },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      role: true,
      status: true,
      currentPersona: true,
      lamportCounter: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  console.log('\n📋 User details:');
  console.log(verified);
  console.log('\n✨ Tristan is ready! Password: changeme');
  console.log('💡 Backend will map tier=PAID → Rosetta role "Operator" (managed governance)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
