import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking existing users in production database...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ${user.role} - ${user.tier} - ${user.status}`);
    });

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();