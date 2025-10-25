test('metrics endpoint returns performance data', async ({ request }) => {
  const res = await request.get(`${MCP_URL}/metrics`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.memory).toBeDefined();
  expect(data.uptime).toBeGreaterThan(0);
});

test('scaling-info endpoint returns scaling data', async ({ request }) => {
  const res = await request.get(`${MCP_URL}/scaling-info`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.instanceId).toBeDefined();
  expect(data.memory).toBeDefined();
});

test('load-test endpoint simulates load', async ({ request }) => {
  const res = await request.post(`${MCP_URL}/load-test`, {
    data: { requests: 10, concurrency: 2 }
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.completed).toBe(10);
  expect(data.errors).toBe(0);
});

test('handshake endpoint accessibility', async ({ request }) => {
  const res = await request.post(`${MCP_URL}/handshake`, {
    data: { token: 'accessibility-test' }
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.status).toBe('handshake-accepted');
  expect(typeof data.token).toBe('string');
  // Accessibility: token should not contain unsafe characters
  expect(/^[a-zA-Z0-9-_]+$/.test(data.token)).toBeTruthy();
});
import { test, expect } from '@playwright/test';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://localhost:4000';

test.describe('Azure MCP Server', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${MCP_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  test('handshake endpoint accepts token', async ({ request }) => {
    const res = await request.post(`${MCP_URL}/handshake`, {
      data: { token: 'test-session-token' }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('handshake-accepted');
    expect(data.token).toBe('test-session-token');
  });

  test('handshake endpoint rejects missing token', async ({ request }) => {
    const res = await request.post(`${MCP_URL}/handshake`, {
      data: {}
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid input|Missing token/);
  });
});
