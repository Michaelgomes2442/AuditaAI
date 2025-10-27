import { PrismaClient } from '@prisma/client';

(async () => {
  const p = new PrismaClient();
  try {
    const c = await p.bENReceipt.count({ where: { realTimestamp: { gte: new Date(0) } } });
    console.log('BENReceipt count >= epoch:', c);
  } catch (e) {
    console.error('Smoke-check error:', e);
  } finally {
    await p.$disconnect();
  }
})();
