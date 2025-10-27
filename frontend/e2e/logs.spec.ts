import { test, expect } from '@playwright/test';

// AuditaAI Governance Audit Logs API Tests
// Tests the audit log and receipt export functionality

const API_BASE = 'http://localhost:3001/api';

test.describe('Governance Audit Logs API', () => {

  test('audit logs endpoint returns governance evaluation history', async ({ request }) => {
    const response = await request.get(`${API_BASE}/logs`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('logs');
    expect(Array.isArray(data.logs)).toBeTruthy();

    if (data.logs.length > 0) {
      const logEntry = data.logs[0];
      expect(logEntry).toHaveProperty('id');
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('evaluation_type');
      expect(logEntry).toHaveProperty('receipt_id');
      expect(logEntry).toHaveProperty('governance_decision');
    }
  });

  test('audit logs support filtering by evaluation type', async ({ request }) => {
    const response = await request.get(`${API_BASE}/logs?evaluation_type=content_analysis`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.logs.every((log: any) => log.evaluation_type === 'content_analysis')).toBeTruthy();
  });

  test('audit logs support filtering by governance decision', async ({ request }) => {
    const response = await request.get(`${API_BASE}/logs?governance_decision=approved`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.logs.every((log: any) => log.governance_decision === 'approved')).toBeTruthy();
  });

  test('audit logs support filtering by date range', async ({ request }) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    const endDate = new Date();

    const response = await request.get(`${API_BASE}/logs?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    data.logs.forEach((log: any) => {
      const logDate = new Date(log.timestamp);
      expect(logDate >= startDate).toBeTruthy();
      expect(logDate <= endDate).toBeTruthy();
    });
  });

  test('audit logs support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE}/logs?page=1&limit=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('page', 1);
    expect(data.pagination).toHaveProperty('limit', 10);
    expect(data.pagination).toHaveProperty('total');
    expect(data.logs.length).toBeLessThanOrEqual(10);
  });

  test('receipt export endpoint provides downloadable receipt data', async ({ request }) => {
    // First get a receipt ID from logs
    const logsResponse = await request.get(`${API_BASE}/logs?limit=1`);
    const logsData = await logsResponse.json();

    if (logsData.logs.length > 0) {
      const receiptId = logsData.logs[0].receipt_id;

      const exportResponse = await request.get(`${API_BASE}/receipts/${receiptId}/export`);
      expect(exportResponse.ok()).toBeTruthy();

      const exportData = await exportResponse.json();
      expect(exportData).toHaveProperty('receipt');
      expect(exportData.receipt).toHaveProperty('id', receiptId);
      expect(exportData.receipt).toHaveProperty('hash');
      expect(exportData.receipt).toHaveProperty('timestamp');
      expect(exportData.receipt).toHaveProperty('evaluation_data');
      expect(exportData.receipt).toHaveProperty('governance_metadata');
    }
  });

  test('bulk receipt export supports multiple receipt formats', async ({ request }) => {
    const exportPayload = {
      receipt_ids: ['receipt-1', 'receipt-2', 'receipt-3'],
      format: 'json'
    };

    const response = await request.post(`${API_BASE}/receipts/export/bulk`, {
      data: exportPayload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('exported_receipts');
    expect(Array.isArray(data.exported_receipts)).toBeTruthy();
    expect(data).toHaveProperty('export_format', 'json');
  });

  test('audit logs include CRIES metrics in evaluation data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/logs?include_cries=true`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.logs.length > 0) {
      const logEntry = data.logs[0];
      expect(logEntry).toHaveProperty('cries_metrics');
      expect(logEntry.cries_metrics).toHaveProperty('coherence');
      expect(logEntry.cries_metrics).toHaveProperty('reliability');
      expect(logEntry.cries_metrics).toHaveProperty('integrity');
      expect(logEntry.cries_metrics).toHaveProperty('effectiveness');
      expect(logEntry.cries_metrics).toHaveProperty('security');
    }
  });

  test('audit logs support searching by receipt hash', async ({ request }) => {
    // First get a receipt hash from logs
    const logsResponse = await request.get(`${API_BASE}/logs?limit=1`);
    const logsData = await logsResponse.json();

    if (logsData.logs.length > 0) {
      const receiptHash = logsData.logs[0].receipt_hash;

      const searchResponse = await request.get(`${API_BASE}/logs?receipt_hash=${receiptHash}`);
      expect(searchResponse.ok()).toBeTruthy();

      const searchData = await searchResponse.json();
      expect(searchData.logs.length).toBeGreaterThan(0);
      expect(searchData.logs[0].receipt_hash).toBe(receiptHash);
    }
  });

  test('audit logs provide governance policy violation details', async ({ request }) => {
    const response = await request.get(`${API_BASE}/logs?governance_decision=rejected`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    data.logs.forEach((log: any) => {
      expect(log.governance_decision).toBe('rejected');
      expect(log).toHaveProperty('violation_details');
      expect(log.violation_details).toHaveProperty('policy_rule');
      expect(log.violation_details).toHaveProperty('violation_reason');
    });
  });

  test('audit logs support real-time streaming for monitoring', async ({ request }) => {
    // Test WebSocket or Server-Sent Events endpoint for real-time logs
    const streamResponse = await request.get(`${API_BASE}/logs/stream`);
    expect([200, 101]).toContain(streamResponse.status()); // 200 for SSE, 101 for WebSocket upgrade

    if (streamResponse.status() === 200) {
      // Server-Sent Events
      const streamData = await streamResponse.text();
      expect(streamData).toContain('data:');
    }
  });

  test('audit logs export supports multiple formats', async ({ request }) => {
    const formats = ['json', 'csv', 'pdf'];

    for (const format of formats) {
      const response = await request.get(`${API_BASE}/logs/export?format=${format}`);
      expect(response.ok()).toBeTruthy();

      if (format === 'json') {
        const data = await response.json();
        expect(data).toHaveProperty('logs');
      } else {
        // For CSV/PDF, check content type
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain(format === 'csv' ? 'text/csv' : 'application/pdf');
      }
    }
  });

});