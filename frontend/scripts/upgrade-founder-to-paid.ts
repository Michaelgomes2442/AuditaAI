import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function upgradeToPaid() {
  try {
    const founder = await prisma.user.update({
      where: { email: 'founder@auditaai.com' },
      data: { tier: 'PAID' }
    });
    
    console.log('✅ Founder account upgraded to PAID tier');
    console.log('   Email:', founder.email);
    console.log('   Role:', founder.role);
    console.log('   Tier:', founder.tier);
  } catch (error) {
    console.error('❌ Failed to upgrade:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeToPaid();
