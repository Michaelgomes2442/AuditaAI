import { test, expect } from './base';
import crypto from 'crypto';

/**
 * Crypto Receipt Test Suite
 * Focused testing for Δ-Receipt cryptographic integrity and hash chaining
 */

// Helper to calculate receipt hash (mimics server logic)
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const sorted: any = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  return sorted;
}

// Helper to calculate receipt hash (mimics server logic)
function calculateReceiptHash(payload: any): string {
  const forHash: any = {};
  Object.keys(payload).sort().forEach(key => {
    // Exclude derived fields from hash calculation (same as server)
    if (key !== 'self_hash' && key !== 'signature' && key !== 'lamport') {
      forHash[key] = payload[key];
    }
  });

  const sorted = sortObjectKeys(forHash);
  return crypto.createHash('sha256')
    .update(JSON.stringify(sorted))
    .digest('hex');
}

test.describe.serial('Δ-Receipt Cryptographic Integrity', () => {
  test('receipt hash calculation consistency', async ({ request }) => {
    // Generate a single receipt
    const analyzeResponse = await request.post('/api/analyze', {
      data: {
        prompt: 'Test prompt for hash verification',
        model: 'test-model'
      }
    });

    expect(analyzeResponse.ok()).toBeTruthy();
    const analyzeData = await analyzeResponse.json();
    expect(analyzeData.receipt).toBeDefined();

    const receipt = analyzeData.receipt;
    console.log('Receipt data keys:', Object.keys(receipt));

    // Verify the receipt has required fields
    expect(receipt.hash).toBeDefined();
    expect(receipt.id).toBeDefined();

    // Get the full receipt from the database
    const fullReceiptResponse = await request.get(`/api/receipts/${receipt.id}`);
    expect(fullReceiptResponse.ok()).toBeTruthy();

    const fullReceipt = await fullReceiptResponse.json();
    expect(fullReceipt.payload).toBeDefined();

    console.log('Full receipt payload keys:', Object.keys(fullReceipt.payload));
    console.log('Full receipt payload:', JSON.stringify(fullReceipt.payload, null, 2));

    // For hash calculation, use the payload as it was during generation (digest_verified = false)
    const payloadForHash = { ...fullReceipt.payload };
    payloadForHash.digest_verified = false; // This was false during hash generation

    // Calculate hash from the payload
    const calculatedHash = calculateReceiptHash(payloadForHash);
    console.log('Calculated hash:', calculatedHash);
    console.log('Receipt hash from API:', receipt.hash);
    console.log('Receipt digest from DB:', fullReceipt.digest);

    // This should match
    expect(calculatedHash).toBe(receipt.hash);
  });

  test('receipt verification API functionality', async ({ request }) => {
    // Generate a fresh receipt
    const analyzeResponse = await request.post('/api/analyze', {
      data: {
        prompt: 'Test prompt for verification',
        model: 'test-model'
      }
    });

    expect(analyzeResponse.ok()).toBeTruthy();
    const analyzeData = await analyzeResponse.json();
    const receipt = analyzeData.receipt;

    // Now verify it immediately
    const verifyResponse = await request.post('/api/receipts/verify', {
      data: { id: receipt.id }
    });

    expect(verifyResponse.ok()).toBeTruthy();
    const verification = await verifyResponse.json();
    expect(verification.valid).toBe(true);
    expect(verification.hash_integrity).toBe(true);
  });

  test('hash chaining integrity', async ({ request }) => {
    // Generate multiple receipts to test chaining
    const receipts = [];

    for (let i = 0; i < 3; i++) {
      const analyzeResponse = await request.post('/api/analyze', {
        data: {
          prompt: `Test prompt ${i} for chaining`,
          model: 'test-model'
        }
      });

      expect(analyzeResponse.ok()).toBeTruthy();
      const analyzeData = await analyzeResponse.json();
      receipts.push(analyzeData.receipt);
    }

    console.log('Generated receipts:');
    receipts.forEach((r, i) => {
      console.log(`Receipt ${i}: id=${r.id}, hash=${r.hash?.substring(0, 16)}..., previous_hash=${r.previous_hash?.substring(0, 16) || 'null'}...`);
    });

    // Verify hash chaining
    for (let i = 1; i < receipts.length; i++) {
      console.log(`Checking chain: receipt ${i}.previous_hash should equal receipt ${i-1}.hash`);
      console.log(`receipt ${i}.previous_hash: ${receipts[i].previous_hash}`);
      console.log(`receipt ${i-1}.hash: ${receipts[i-1].hash}`);
      
      if (receipts[i].previous_hash !== receipts[i-1].hash) {
        console.log('Hash chaining failed!');
        expect(receipts[i].previous_hash).toBe(receipts[i-1].hash);
      }
    }
  });
});
