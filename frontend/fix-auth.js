const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndFixAuth() {
  const user = await prisma.user.findUnique({
    where: { email: 'founder@auditaai.com' }
  });
  
  if (!user) {
    console.log('❌ User not found - creating new founder account...');
    const hashedPassword = await bcrypt.hash('Toby60022006!!!', 10);
    await prisma.user.create({
      data: {
        email: 'founder@auditaai.com',
        password: hashedPassword,
        name: 'Michael Tobin Gomes (Founder)',
        role: 'ARCHITECT',
        tier: 'ARCHITECT',
        status: 'ACTIVE',
        permissions: [
          'READ_LOGS',
          'WRITE_LOGS',
          'MANAGE_USERS',
          'MANAGE_TEAMS',
          'VERIFY_RECORDS',
          'EXPORT_DATA',
          'VIEW_ANALYTICS',
          'MANAGE_SETTINGS'
        ]
      }
    });
    console.log('✅ Founder account created');
    await prisma.$disconnect();
    return;
  }
  
  console.log('✅ User found:', {
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    status: user.status
  });
  
  const testPass = 'Toby60022006!!!';
  const isValid = await bcrypt.compare(testPass, user.password);
  console.log('\nPassword test:', isValid ? '✅ VALID' : '❌ INVALID');
  
  if (!isValid) {
    console.log('\n🔄 Password mismatch - resetting...');
    const newHash = await bcrypt.hash(testPass, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: newHash,
        tier: 'ARCHITECT'
      }
    });
    console.log('✅ Password reset complete');
    
    // Verify the new password
    const newUser = await prisma.user.findUnique({ where: { id: user.id } });
    const nowValid = await bcrypt.compare(testPass, newUser.password);
    console.log('✅ Verification:', nowValid ? 'Password now works!' : 'Still broken');
  }
  
  await prisma.$disconnect();
}

checkAndFixAuth().catch(console.error);
