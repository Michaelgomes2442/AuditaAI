import { test, expect } from '@playwright/test';

// Require explicit MCP server URL for these tests. If the environment
// doesn't provide MCP_SERVER_URL we skip the entire file so CI/deploys that
// don't have that infra won't attempt to hit localhost.
const MCP_URL = process.env.MCP_SERVER_URL;
test.skip(!MCP_URL, 'MCP_SERVER_URL not set — skipping MCP server tests');

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

