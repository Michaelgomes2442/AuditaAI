#!/usr/bin/env node
import ReceiptService from '../src/receipt-service.js';

(async () => {
  // Minimal mock prisma implementing only what's needed by ReceiptService.generateAnalysisReceipt
  const mockPrisma = {
    bENReceipt: {
      findFirst: async (opts) => null,
      create: async ({ data }) => ({ id: 999, ...data }),
      findMany: async () => [],
      count: async () => 0,
    },
    lamportCounter: {
      upsert: async () => ({ currentValue: 1 }),
    },
    // Raw query fallbacks
    $queryRaw: async () => [],
    $queryRawUnsafe: async () => [],
  };

  const svc = new ReceiptService(mockPrisma);

  try {
    const result = await svc.generateAnalysisReceipt(
      'test-model',
      'This is a test prompt.',
      'This is a test response.',
      { C: 0.1, R: 0.1, I: 0.1, E: 0.1, S: 0.1, overall: 0.1 },
      1,
      { smoke: true }
    );

    console.log('SMOKE TEST RESULT:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('SMOKE TEST ERROR:');
    console.error(err);
    process.exit(2);
  }
})();
