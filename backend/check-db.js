import { createOptimizedPrismaClient } from './src/prisma-optimize.ts';

const prisma = createOptimizedPrismaClient();

async function checkDb() {
  const counter = await prisma.lamportCounter.findUnique({ where: { id: 1 } });
  console.log('Lamport counter:', counter);

  const receipts = await prisma.bENReceipt.findMany({
    select: { id: true, lamportClock: true, digest: true, previousDigest: true },
    orderBy: { id: 'asc' },
    take: 5
  });
  console.log('Recent receipts:', receipts);
}

checkDb();