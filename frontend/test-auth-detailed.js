const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  const email = 'founder@auditaai.com';
  const password = 'Toby60022006!!!';
  
  console.log('🔍 Testing authentication for:', email);
  console.log('');
  
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        tier: true,
        status: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Tier:', user.tier);
    console.log('   Status:', user.status);
    console.log('');
    
    // Check status
    if (user.status !== 'ACTIVE') {
      console.log('❌ User status is not ACTIVE:', user.status);
      return;
    }
    console.log('✅ User status is ACTIVE');
    console.log('');
    
    // Test password
    console.log('🔐 Testing password...');
    console.log('   Input password:', password);
    console.log('   Stored hash:', user.password);
    console.log('');
    
    const valid = await bcrypt.compare(password, user.password);
    console.log('   bcrypt.compare result:', valid);
    console.log('');
    
    if (valid) {
      console.log('✅ PASSWORD VALID - Authentication should work!');
      console.log('');
      console.log('Return object would be:');
      console.log({
        id: String(user.id),
        email: user.email,
        name: user.name || '',
        role: user.role,
        tier: user.tier
      });
    } else {
      console.log('❌ PASSWORD INVALID');
      console.log('');
      console.log('Possible issues:');
      console.log('1. Password in database is different');
      console.log('2. Extra whitespace in input or stored password');
      console.log('3. Hash corruption');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
