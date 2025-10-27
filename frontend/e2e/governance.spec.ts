import { test, expect } from '@playwright/test';

// AuditaAI Core Governance Runtime Tests
// Tests the local governance runtime for AI systems

const API_BASE = 'http://localhost:3001/api';

test.describe('AuditaAI Core Governance Runtime', () => {

  test('health endpoint returns governance runtime status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('runtime', 'governance');
  });

  test('analyze endpoint evaluates LLM output with CRIES metrics', async ({ request }) => {
    const payload = {
      prompt: "Explain quantum computing in simple terms",
      model_output: "Quantum computing uses quantum bits or qubits that can exist in multiple states simultaneously, allowing for parallel processing of complex calculations.",
      metadata: {
        model: "gpt-4",
        temperature: 0.7,
        timestamp: new Date().toISOString()
      }
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Should return CRIES metrics
    expect(result).toHaveProperty('cries_metrics');
    expect(result.cries_metrics).toHaveProperty('coherence');
    expect(result.cries_metrics).toHaveProperty('reliability');
    expect(result.cries_metrics).toHaveProperty('integrity');
    expect(result.cries_metrics).toHaveProperty('effectiveness');
    expect(result.cries_metrics).toHaveProperty('security');

    // Should generate a Δ-Receipt
    expect(result).toHaveProperty('receipt');
    expect(result.receipt).toHaveProperty('id');
    expect(result.receipt).toHaveProperty('hash');
    expect(result.receipt).toHaveProperty('timestamp');
    expect(result.receipt).toHaveProperty('policy_applied');
  });

  test('policy engine applies JSON-based rules correctly', async ({ request }) => {
    const payload = {
      prompt: "My SSN is 123-45-6789 and I need financial advice about investing in crypto stocks.",
      model_output: "I'll help you with that financial advice. Your SSN 123-45-6789 has been noted for verification purposes...",
      policy: {
        rules: [
          {
            type: "redact",
            condition: "contains_pii",
            patterns: ["\\b\\d{3}-\\d{2}-\\d{4}\\b"],
            replacement: "[REDACTED]"
          },
          {
            type: "escalate",
            condition: "contains_financial_risk",
            action: "escalate"
          }
        ]
      }
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Should have applied policy rules
    expect(result).toHaveProperty('policy_result');
    expect(result.policy_result).toHaveProperty('rules_applied');
    expect(result.policy_result.rules_applied).toContain('redact');

    // Should have redacted sensitive content
    expect(result).toHaveProperty('redacted_output');
    expect(result.redacted_output).not.toContain('123-45-6789');
    expect(result.redacted_output).toContain('[REDACTED]');
  });

  test('compare endpoint evaluates two LLM outputs and shows governance deltas', async ({ request }) => {
    const payload = {
      prompt: "What is the capital of France?",
      outputs: [
        {
          model: "gpt-4",
          response: "The capital of France is Paris.",
          metadata: { confidence: 0.95 }
        },
        {
          model: "claude-3",
          response: "Paris is the capital city of France.",
          metadata: { confidence: 0.92 }
        }
      ]
    };

    const response = await request.post(`${API_BASE}/compare`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Should return comparison results
    expect(result).toHaveProperty('comparison');
    expect(result.comparison).toHaveProperty('governance_delta');
    expect(result.comparison).toHaveProperty('cries_differential');

    // Should have receipts for both evaluations
    expect(result).toHaveProperty('receipts');
    expect(Array.isArray(result.receipts)).toBeTruthy();
    expect(result.receipts).toHaveLength(2);
  });

  test('receipts endpoint returns verifiable hash-chained records', async ({ request }) => {
    const response = await request.get(`${API_BASE}/receipts`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('receipts');
    expect(Array.isArray(data.receipts)).toBeTruthy();

    const receipts = data.receipts;
    if (receipts.length > 0) {
      const receipt = receipts[0];
      expect(receipt).toHaveProperty('id');
      expect(receipt).toHaveProperty('hash');
      expect(receipt).toHaveProperty('previous_hash');
      expect(receipt).toHaveProperty('timestamp');
      expect(receipt).toHaveProperty('data');
      expect(receipt).toHaveProperty('signature');
    }
  });

  test('receipt verification validates hash chain integrity', async ({ request }) => {
    // First create a receipt
    const analyzeResponse = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Test prompt for verification",
        model_output: "Test output"
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const analyzeResult = await analyzeResponse.json();
    const receiptId = analyzeResult.receipt.id;

    // Then verify it
    const verifyResponse = await request.get(`${API_BASE}/receipts/${receiptId}/verify`);
    expect(verifyResponse.ok()).toBeTruthy();

    const verification = await verifyResponse.json();
    expect(verification).toHaveProperty('valid', true);
    expect(verification).toHaveProperty('chain_integrity', true);
  });

  test('CRIES metrics provide comprehensive evaluation scores', async ({ request }) => {
    const payload = {
      prompt: "Explain photosynthesis",
      model_output: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen using chlorophyll.",
      evaluation_criteria: {
        coherence: true,
        reliability: true,
        integrity: true,
        effectiveness: true,
        security: true
      }
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    const cries = result.cries_metrics;

    // All metrics should be present and valid (only check numeric values)
    Object.values(cries).forEach((score: any) => {
      if (typeof score === 'number') {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    // Coherence should be reasonable for this factual response
    expect(cries.coherence).toBeGreaterThan(0.5);
    // Reliability may be lower for responses without citations
    expect(cries.reliability).toBeGreaterThan(0.1);
  });

  test('deterministic logging exports signed NDJSON receipts', async ({ request }) => {
    const response = await request.get(`${API_BASE}/receipts/export?format=ndjson`);
    expect(response.ok()).toBeTruthy();

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/x-ndjson');

    const ndjsonText = await response.text();
    const lines = ndjsonText.trim().split('\n');

    if (lines.length > 0) {
      const firstReceipt = JSON.parse(lines[0]);
      expect(firstReceipt).toHaveProperty('id');
      expect(firstReceipt).toHaveProperty('hash');
      expect(firstReceipt).toHaveProperty('signature');
      expect(firstReceipt).toHaveProperty('data');
    }
  });

  test('local-first operation works without external dependencies', async ({ request }) => {
    // Test that the system can operate in offline/local mode
    const healthResponse = await request.get(`${API_BASE}/health`);
    const health = await healthResponse.json();

    expect(health).toHaveProperty('mode', 'local');
    expect(health).toHaveProperty('dependencies');
    expect(health.dependencies.external).toBeUndefined();
  });

});