import { test, expect } from '@playwright/test';

// CRIES Metrics Tests
// Tests Coherence, Reliability, Integrity, Effectiveness, Security evaluation

const API_BASE = 'http://localhost:3001/api';

test.describe('CRIES Metrics Evaluation', () => {

  test('coherence metric evaluates logical consistency', async ({ request }) => {
    const testCases = [
      {
        prompt: "Explain gravity",
        output: "Gravity is a force that attracts objects with mass toward each other. The strength depends on mass and distance.",
        expectedCoherence: 0.9 // High coherence - logically consistent
      },
      {
        prompt: "Explain gravity",
        output: "Gravity is when things fall up sometimes but not always. It depends on the color of your shirt.",
        expectedCoherence: 0.2 // Low coherence - illogical and inconsistent
      }
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: testCase.prompt,
          model_output: testCase.output
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.cries_metrics.coherence).toBeCloseTo(testCase.expectedCoherence, 1);
    }
  });

  test('reliability metric assesses factual accuracy', async ({ request }) => {
    const testCases = [
      {
        prompt: "What is the capital of France?",
        output: "Paris is the capital of France.",
        expectedReliability: 1.0 // Perfectly reliable - factually correct
      },
      {
        prompt: "What is the capital of France?",
        output: "London is the capital of France.",
        expectedReliability: 0.0 // Completely unreliable - factually wrong
      }
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: testCase.prompt,
          model_output: testCase.output
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.cries_metrics.reliability).toBeCloseTo(testCase.expectedReliability, 1);
    }
  });

  test('integrity metric checks for manipulation or bias', async ({ request }) => {
    const testCases = [
      {
        prompt: "Review this product objectively",
        output: "This product works as advertised and meets all specifications.",
        expectedIntegrity: 0.9 // High integrity - objective assessment
      },
      {
        prompt: "Review this product",
        output: "This is the most amazing product ever created! You absolutely must buy it right now!",
        expectedIntegrity: 0.3 // Low integrity - promotional bias
      }
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: testCase.prompt,
          model_output: testCase.output
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.cries_metrics.integrity).toBeCloseTo(testCase.expectedIntegrity, 1);
    }
  });

  test('effectiveness metric measures goal achievement', async ({ request }) => {
    const testCases = [
      {
        prompt: "Write a function to calculate factorial",
        output: "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
        expectedEffectiveness: 0.95 // Highly effective - correct implementation
      },
      {
        prompt: "Write a function to calculate factorial",
        output: "function factorial(n) { return 42; } // This is the answer to everything",
        expectedEffectiveness: 0.1 // Low effectiveness - doesn't solve the problem
      }
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: testCase.prompt,
          model_output: testCase.output
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.cries_metrics.effectiveness).toBeCloseTo(testCase.expectedEffectiveness, 1);
    }
  });

  test('security metric identifies potential vulnerabilities', async ({ request }) => {
    const testCases = [
      {
        prompt: "Generate a secure password",
        output: "Your secure password is: Tr!ckyP@ssw0rd2024!#",
        expectedSecurity: 0.8 // Good security - strong password
      },
      {
        prompt: "Generate a secure password",
        output: "Your secure password is: password123",
        expectedSecurity: 0.1 // Poor security - weak password
      }
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: testCase.prompt,
          model_output: testCase.output
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result.cries_metrics.security).toBeCloseTo(testCase.expectedSecurity, 1);
    }
  });

  test('CRIES metrics are calculated consistently for same input', async ({ request }) => {
    const payload = {
      prompt: "What is machine learning?",
      model_output: "Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed."
    };

    // Run the same analysis multiple times
    const results = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: payload,
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      results.push(result.cries_metrics);
    }

    // All results should be identical (deterministic)
    expect(results[0].coherence).toBe(results[1].coherence);
    expect(results[0].reliability).toBe(results[1].reliability);
    expect(results[0].integrity).toBe(results[1].integrity);
    expect(results[0].effectiveness).toBe(results[1].effectiveness);
    expect(results[0].security).toBe(results[1].security);
  });

  test('CRIES metrics include detailed explanations', async ({ request }) => {
    const response = await request.post(`${API_BASE}/analyze`, {
      data: {
        prompt: "Explain photosynthesis",
        model_output: "Photosynthesis is how plants make food using sunlight.",
        include_explanations: true
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result.cries_metrics).toHaveProperty('explanations');
    expect(result.cries_metrics.explanations).toHaveProperty('coherence');
    expect(result.cries_metrics.explanations).toHaveProperty('reliability');
    expect(result.cries_metrics.explanations).toHaveProperty('integrity');
    expect(result.cries_metrics.explanations).toHaveProperty('effectiveness');
    expect(result.cries_metrics.explanations).toHaveProperty('security');

    // Explanations should be descriptive strings
    Object.values(result.cries_metrics.explanations).forEach((explanation: any) => {
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(10);
    });
  });

  test('CRIES metrics handle edge cases gracefully', async ({ request }) => {
    const edgeCases = [
      { prompt: "", output: "Some response" }, // Empty prompt
      { prompt: "Hello", output: "" }, // Empty output
      { prompt: "A".repeat(10000), output: "Short response" }, // Very long prompt
      { prompt: "Normal prompt", output: "B".repeat(50000) } // Very long output
    ];

    for (const testCase of edgeCases) {
      const response = await request.post(`${API_BASE}/analyze`, {
        data: {
          prompt: testCase.prompt,
          model_output: testCase.output
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      // Should still return valid CRIES metrics
      expect(result).toHaveProperty('cries_metrics');
      const cries = result.cries_metrics;

      Object.values(cries).forEach((score: any) => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    }
  });

});