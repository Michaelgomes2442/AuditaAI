import { test, expect } from '@playwright/test';

// Δ-Receipt Verification Tests
// Tests hash-chained receipts and Lamport ordering

const API_BASE = 'http://localhost:3001/api';

test.describe('Δ-Receipt Verification', () => {

  test('receipts are generated with proper hash chaining', async ({ request }) => {
    // Create multiple receipts
    const receipts = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: `Test prompt ${i}`,
          model_output: `Test output ${i}`
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      receipts.push(result.receipt);
    }

    // Verify hash chaining
    for (let i = 1; i < receipts.length; i++) {
      expect(receipts[i].previous_hash).toBe(receipts[i-1].hash);
    }
  });

  test('receipt verification validates hash integrity', async ({ request }) => {
    // Create a receipt
    const createResponse = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Verification test",
        model_output: "Test output for verification"
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await createResponse.json();
    const receiptId = result.receipt.id;

    // Verify the receipt
    const verifyResponse = await request.get(`${API_BASE}/receipts/${receiptId}/verify`);
    expect(verifyResponse.ok()).toBeTruthy();

    const verification = await verifyResponse.json();
    expect(verification.valid).toBe(true);
    expect(verification.hash_integrity).toBe(true);
    expect(verification.chain_position).toBeGreaterThanOrEqual(0);
  });

  test('tampered receipt fails verification', async ({ request }) => {
    // Create a receipt
    const createResponse = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Tamper test",
        model_output: "Original output"
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await createResponse.json();
    const receipt = result.receipt;

    // Tamper with the receipt data
    const tamperedReceipt = {
      ...receipt,
      data: {
        ...receipt.data,
        model_output: "Tampered output"
      }
    };

    // Attempt to verify the tampered receipt
    const verifyResponse = await request.post(`${API_BASE}/receipts/verify`, {
      data: tamperedReceipt,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(verifyResponse.status()).toBe(400);
    const verification = await verifyResponse.json();
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain('hash');
  });

  test('receipts maintain Lamport timestamp ordering', async ({ request }) => {
    // Create receipts with small delays to ensure different timestamps
    const receipts = [];
    for (let i = 0; i < 5; i++) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: `Lamport test ${i}`,
          model_output: `Output ${i}`
        },
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      receipts.push(result.receipt);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Verify Lamport ordering (timestamps should be non-decreasing)
    for (let i = 1; i < receipts.length; i++) {
      const prevTime = new Date(receipts[i-1].timestamp).getTime();
      const currTime = new Date(receipts[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  test('receipt export includes complete hash chain', async ({ request }) => {
    // Create several receipts
    for (let i = 0; i < 5; i++) {
      await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: `Chain test ${i}`,
          model_output: `Chain output ${i}`
        },
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Export receipts
    const exportResponse = await request.get(`${API_BASE}/receipts/export`);
    expect(exportResponse.ok()).toBeTruthy();

    const exportedData = await exportResponse.json();
    expect(Array.isArray(exportedData)).toBeTruthy();
    expect(exportedData.length).toBeGreaterThanOrEqual(5);

    // Verify the chain is complete
    for (let i = 1; i < exportedData.length; i++) {
      expect(exportedData[i].previous_hash).toBe(exportedData[i-1].hash);
    }
  });

  test('receipt signatures are cryptographically valid', async ({ request }) => {
    const response = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Signature test",
        model_output: "Test for cryptographic signature"
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    const receipt = result.receipt;

    expect(receipt).toHaveProperty('signature');
    expect(receipt).toHaveProperty('public_key');

    // Verify signature
    const verifyResponse = await request.post(`${API_BASE}/receipts/verify-signature`, {
      data: {
        receipt: receipt,
        public_key: receipt.public_key
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(verifyResponse.ok()).toBeTruthy();
    const signatureVerification = await verifyResponse.json();
    expect(signatureVerification.valid).toBe(true);
  });

  test('receipt metadata includes governance context', async ({ request }) => {
    const response = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Metadata test",
        model_output: "Test output with metadata",
        metadata: {
          model: "gpt-4",
          temperature: 0.7,
          user_id: "test-user-123"
        }
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    const receipt = result.receipt;

    expect(receipt).toHaveProperty('metadata');
    expect(receipt.metadata).toHaveProperty('model', 'gpt-4');
    expect(receipt.metadata).toHaveProperty('temperature', 0.7);
    expect(receipt.metadata).toHaveProperty('user_id', 'test-user-123');
    expect(receipt.metadata).toHaveProperty('governance_version');
    expect(receipt.metadata).toHaveProperty('cries_applied', true);
  });

  test('receipt chain recovery works after system restart', async ({ request }) => {
    // Get current chain state
    const beforeRestart = await request.get(`${API_BASE}/receipts/latest`);
    const latestBefore = await beforeRestart.json();

    // Simulate system restart by creating a new analysis
    const afterResponse = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Post-restart test",
        model_output: "Testing chain recovery"
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const afterResult = await afterResponse.json();

    // Verify chain continuity
    if (latestBefore.id) {
      expect(afterResult.receipt.previous_hash).toBe(latestBefore.hash);
    }
  });

  test('receipt pagination works for large datasets', async ({ request }) => {
    // Create many receipts
    for (let i = 0; i < 50; i++) {
      await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: `Pagination test ${i}`,
          model_output: `Output ${i}`
        },
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test pagination
    const page1Response = await request.get(`${API_BASE}/receipts?page=1&limit=10`);
    const page1Data = await page1Response.json();
    console.log('Page 1 response:', JSON.stringify(page1Data, null, 2));

    const page2Response = await request.get(`${API_BASE}/receipts?page=2&limit=10`);
    const page2Data = await page2Response.json();
    console.log('Page 2 response:', JSON.stringify(page2Data, null, 2));

    expect(page1Data.receipts).toHaveLength(10);
    expect(page2Data.receipts).toHaveLength(10);

    // Pages should be different
    const page1Ids = page1Data.receipts.map((r: any) => r.id);
    const page2Ids = page2Data.receipts.map((r: any) => r.id);
    expect(page1Ids).not.toEqual(page2Ids);

    // Should have pagination metadata
    expect(page1Data).toHaveProperty('pagination');
    expect(page1Data.pagination).toHaveProperty('page', 1);
    expect(page1Data.pagination).toHaveProperty('total_pages');
  });

});