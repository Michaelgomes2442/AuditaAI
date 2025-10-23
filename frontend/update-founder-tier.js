const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function updateFounderTier() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'founder@auditaai.com' },
      data: { tier: 'ARCHITECT' }
    });
    
    console.log('✅ Founder account updated:', {
      email: updated.email,
      name: updated.name,
      role: updated.role,
      tier: updated.tier,
      status: updated.status
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateFounderTier();
