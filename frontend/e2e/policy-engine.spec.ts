import { test, expect } from '@playwright/test';

// Policy Engine Tests
// Tests JSON-based rules for content governance

const API_BASE = 'http://localhost:3001/api';

test.describe('Policy Engine', () => {

  test('block rule prevents harmful content from being processed', async ({ request }) => {
    const payload = {
      prompt: "How to create illegal substances?",
      model_output: "To create methamphetamine, you would need pseudoephedrine, red phosphorus, and iodine...",
      policy: {
        rules: [
          {
            type: "block",
            condition: "contains_illegal_activity",
            action: "reject"
          }
        ]
      }
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(403);
    const result = await response.json();
    expect(result).toHaveProperty('error', 'Content blocked by policy');
    expect(result).toHaveProperty('rule_applied', 'block');
  });

  test('redact rule removes sensitive information', async ({ request }) => {
    const payload = {
      prompt: "What is John's social security number?",
      model_output: "John's SSN is 123-45-6789 and his address is 123 Main St.",
      policy: {
        rules: [
          {
            type: "redact",
            condition: "contains_pii",
            patterns: ["\\d{3}-\\d{2}-\\d{4}", "\\d+\\s+\\w+\\s+St\\."]
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

    expect(result).toHaveProperty('redacted_output');
    expect(result.redacted_output).not.toContain('123-45-6789');
    expect(result.redacted_output).not.toContain('123 Main St.');
    expect(result.redacted_output).toContain('[REDACTED]');
  });

  test('route rule directs content to appropriate handlers', async ({ request }) => {
    const payload = {
      prompt: "Medical diagnosis for chest pain",
      model_output: "This could be a heart attack. Please seek immediate medical attention.",
      policy: {
        rules: [
          {
            type: "route",
            condition: "contains_medical_advice",
            destination: "medical_review_queue"
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

    expect(result).toHaveProperty('routing');
    expect(result.routing).toHaveProperty('destination', 'medical_review_queue');
    expect(result.routing).toHaveProperty('escalated', true);
  });

  test('escalate rule triggers human review for high-risk content', async ({ request }) => {
    const payload = {
      prompt: "Investment advice for high-risk trading",
      model_output: "You should invest everything in cryptocurrency futures with 10x leverage.",
      policy: {
        rules: [
          {
            type: "escalate",
            condition: "contains_financial_risk",
            priority: "high"
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

    expect(result).toHaveProperty('escalation');
    expect(result.escalation).toHaveProperty('priority', 'high');
    expect(result.escalation).toHaveProperty('requires_human_review', true);
    expect(result.escalation).toHaveProperty('review_reason', 'financial_risk');
  });

  test('multiple rules are applied in correct precedence order', async ({ request }) => {
    const payload = {
      prompt: "How to hack and steal financial data?",
      model_output: "First, use phishing to get credentials, then SQL injection to access the database...",
      policy: {
        rules: [
          {
            type: "redact",
            condition: "contains_technical_details",
            patterns: ["SQL injection", "phishing"]
          },
          {
            type: "block",
            condition: "contains_illegal_activity",
            action: "reject"
          }
        ]
      }
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    // Block rule should take precedence and reject the request
    expect(response.status()).toBe(403);
    const result = await response.json();
    expect(result).toHaveProperty('rule_applied', 'block');
  });

  test('custom policy rules can be loaded and applied', async ({ request }) => {
    const customPolicy = {
      name: "content_moderation_v2",
      version: "2.0",
      rules: [
        {
          type: "redact",
          condition: "contains_profanity",
          patterns: ["damn", "hell"],
          replacement: "[PROFANITY]"
        }
      ]
    };

    // First load the custom policy
    const loadResponse = await request.post(`${API_BASE}/policies`, {
      data: customPolicy,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(loadResponse.ok()).toBeTruthy();

    // Then test it
    const testPayload = {
      prompt: "What the hell is going on?",
      model_output: "This is damn confusing.",
      policy_id: "content_moderation_v2"
    };

    const analyzeResponse = await request.post(`${API_BASE}/analyze`, {
      data: testPayload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(analyzeResponse.ok()).toBeTruthy();
    const result = await analyzeResponse.json();

    expect(result.redacted_output).toContain('[PROFANITY]');
    expect(result.redacted_output).not.toContain('damn');
    expect(result.redacted_output).not.toContain('hell');
  });

  test('policy violations are logged with full context', async ({ request }) => {
    const payload = {
      prompt: "Generate offensive content",
      model_output: "Here is some highly offensive content...",
      policy: {
        rules: [
          {
            type: "block",
            condition: "contains_offensive_content",
            action: "reject"
          }
        ]
      }
    };

    const response = await request.post(`${API_BASE}/analyze`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(403);

    // Check that violation was logged
    const logsResponse = await request.get(`${API_BASE}/logs?governance_decision=rejected`);
    expect(logsResponse.ok()).toBeTruthy();

    const logsData = await logsResponse.json();
    const violationLog = logsData.logs.find((log: any) => log.event === 'policy_violation');

    expect(violationLog).toBeTruthy();
    expect(violationLog).toHaveProperty('rule_type', 'block');
    expect(violationLog).toHaveProperty('violation_details');
  });

});