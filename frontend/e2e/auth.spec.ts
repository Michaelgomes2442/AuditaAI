import { test, expect } from './base';

// AuditaAI Governance Runtime API Tests
// Tests the core governance functionality via REST API

const API_BASE = 'http://localhost:3001/api';

test.describe('Governance Runtime API', () => {

  test('health endpoint confirms governance runtime status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('runtime', 'governance');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('uptime');
  });

  test('analyze endpoint processes LLM output with governance evaluation', async ({ request }) => {
    const payload = {
      prompt: "Explain machine learning in simple terms",
      model_output: "Machine learning is a type of artificial intelligence that allows computers to learn from data and improve their performance without being explicitly programmed for every scenario.",
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

    console.log('Response status:', response.status());
    console.log('Response status text:', response.statusText());
    const responseText = await response.text();
    console.log('Response body:', responseText);

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Should return governance evaluation
    expect(result).toHaveProperty('evaluation');
    expect(result.evaluation).toHaveProperty('approved', true);
    expect(result.evaluation).toHaveProperty('confidence_score');

    // Should include CRIES metrics
    expect(result).toHaveProperty('cries_metrics');
    expect(result.cries_metrics).toHaveProperty('coherence');
    expect(result.cries_metrics).toHaveProperty('reliability');
    expect(result.cries_metrics).toHaveProperty('integrity');
    expect(result.cries_metrics).toHaveProperty('effectiveness');
    expect(result.cries_metrics).toHaveProperty('security');

    // Should generate Δ-Receipt
    expect(result).toHaveProperty('receipt');
    expect(result.receipt).toHaveProperty('id');
    expect(result.receipt).toHaveProperty('hash');
    expect(result.receipt).toHaveProperty('timestamp');
  });

  test('CRIES metrics provide consistent evaluation scores', async ({ request }) => {
    const testPayload = {
      prompt: "What is the scientific method?",
      model_output: "The scientific method is a systematic approach to investigating phenomena, acquiring new knowledge, or correcting and integrating previous knowledge."
    };

    // Run the same evaluation multiple times
    const results = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: testPayload,
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      results.push(result.cries_metrics);
    }

    // Scores should be consistent (deterministic evaluation)
    expect(results[0].coherence).toBe(results[1].coherence);
    expect(results[0].reliability).toBe(results[1].reliability);
    expect(results[0].effectiveness).toBe(results[1].effectiveness);
  });

  test('receipt verification validates governance chain integrity', async ({ request }) => {
    // Create a governance evaluation
    const analyzeResponse = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Test governance evaluation",
        model_output: "Test output for receipt verification"
      },
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await analyzeResponse.json();
    const receiptId = result.receipt.id;

    // Verify the receipt
    const verifyResponse = await request.get(`${API_BASE}/receipts/${receiptId}/verify`);
    expect(verifyResponse.ok()).toBeTruthy();

    const verification = await verifyResponse.json();
    expect(verification).toHaveProperty('valid', true);
    expect(verification).toHaveProperty('chain_integrity', true);
    expect(verification).toHaveProperty('governance_valid', true);
  });

  test('comparison endpoint evaluates multiple LLM outputs', async ({ request }) => {
    const comparisonPayload = {
      prompt: "Explain photosynthesis",
      outputs: [
        {
          model: "gpt-4",
          response: "Photosynthesis is the process by which plants convert light energy into chemical energy.",
          metadata: { temperature: 0.3 }
        },
        {
          model: "claude-3",
          response: "Photosynthesis involves plants using sunlight to convert carbon dioxide and water into glucose and oxygen.",
          metadata: { temperature: 0.5 }
        }
      ]
    };

    const response = await request.post(`${API_BASE}/compare`, {
      data: comparisonPayload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result).toHaveProperty('comparison');
    expect(result.comparison).toHaveProperty('governance_differential');
    expect(result.comparison).toHaveProperty('recommended_model');
    expect(result.comparison).toHaveProperty('confidence_comparison');

    // Should have receipts for both evaluations
    expect(result).toHaveProperty('receipts');
    expect(Array.isArray(result.receipts)).toBeTruthy();
    expect(result.receipts).toHaveLength(2);
  });

  test('governance runtime handles malformed requests gracefully', async ({ request }) => {
    const malformedPayloads = [
      { prompt: "", model_output: "some output" }, // Empty prompt
      { prompt: null, model_output: "output" }, // Null prompt
      { prompt: "test", model: 123 }, // Invalid model type
      { prompt: "test", model_output: 123 }, // Invalid model_output type
      { invalid_field: "test" } // Missing required fields
    ];

    for (const payload of malformedPayloads) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: payload,
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid|missing|required|must be/i);
    }
  });

  test('governance runtime enforces rate limits appropriately', async ({ request }) => {
    const payload = {
      prompt: "Rate limit test",
      model_output: "Test output"
    };

    // Make multiple rapid requests
    const responses = [];
    for (let i = 0; i < 15; i++) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: payload,
        headers: { 'Content-Type': 'application/json' }
      });
      responses.push(response);
    }

    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    if (rateLimitedResponses.length > 0) {
      const result = await rateLimitedResponses[0].json();
      expect(result).toHaveProperty('error', 'Rate limit exceeded');
      expect(result).toHaveProperty('retry_after');
    }
  });

  test('governance runtime provides detailed evaluation explanations', async ({ request }) => {
    const payload = {
      prompt: "Explain quantum entanglement",
      model_output: "Quantum entanglement is when two particles are linked such that the state of one instantly influences the state of the other, no matter the distance.",
      include_explanations: true
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result).toHaveProperty('explanations');
    expect(result.explanations).toHaveProperty('coherence_explanation');
    expect(result.explanations).toHaveProperty('reliability_explanation');
    expect(result.explanations).toHaveProperty('governance_decision');

    // Explanations should be descriptive
    expect(result.explanations.coherence_explanation.length).toBeGreaterThan(20);
    expect(result.explanations.governance_decision.length).toBeGreaterThan(10);
  });

});