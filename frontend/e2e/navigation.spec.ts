import { test, expect } from './base';

// AuditaAI Governance Dashboard API Tests
// Tests the governance dashboard and metrics overview functionality

const API_BASE = 'http://localhost:3001/api';

test.describe('Governance Dashboard API', () => {

  test('dashboard endpoint provides governance overview metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('overview');
    expect(data.overview).toHaveProperty('total_evaluations');
    expect(data.overview).toHaveProperty('approved_evaluations');
    expect(data.overview).toHaveProperty('rejected_evaluations');
    expect(data.overview).toHaveProperty('average_confidence_score');
    expect(data.overview).toHaveProperty('uptime_percentage');
  });

  test('dashboard provides real-time governance metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/metrics/realtime`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('current_hour');
    expect(data.current_hour).toHaveProperty('evaluations_count');
    expect(data.current_hour).toHaveProperty('approval_rate');
    expect(data.current_hour).toHaveProperty('average_response_time');

    expect(data).toHaveProperty('last_24_hours');
    expect(data.last_24_hours).toHaveProperty('evaluations_trend');
    expect(data.last_24_hours).toHaveProperty('policy_violations');
  });

  test('dashboard shows CRIES metrics distribution', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/cries-distribution`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('cries_distribution');
    expect(data.cries_distribution).toHaveProperty('coherence');
    expect(data.cries_distribution).toHaveProperty('reliability');
    expect(data.cries_distribution).toHaveProperty('integrity');
    expect(data.cries_distribution).toHaveProperty('effectiveness');
    expect(data.cries_distribution).toHaveProperty('security');

    // Each metric should have score ranges
    Object.values(data.cries_distribution).forEach((metric: any) => {
      expect(metric).toHaveProperty('excellent');
      expect(metric).toHaveProperty('good');
      expect(metric).toHaveProperty('fair');
      expect(metric).toHaveProperty('poor');
    });
  });

  test('dashboard provides policy enforcement statistics', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/policy-stats`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('policy_enforcement');
    expect(data.policy_enforcement).toHaveProperty('active_policies');
    expect(data.policy_enforcement).toHaveProperty('violations_today');
    expect(data.policy_enforcement).toHaveProperty('most_triggered_rules');

    expect(data.policy_enforcement).toHaveProperty('rule_effectiveness');
    expect(data.policy_enforcement.rule_effectiveness).toHaveProperty('block_rules');
    expect(data.policy_enforcement.rule_effectiveness).toHaveProperty('redact_rules');
    expect(data.policy_enforcement.rule_effectiveness).toHaveProperty('escalate_rules');
  });

  test('dashboard shows governance alerts and notifications', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/alerts`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('alerts');
    expect(Array.isArray(data.alerts)).toBeTruthy();

    if (data.alerts.length > 0) {
      const alert = data.alerts[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('resolved');
    }
  });

  test('dashboard provides system health indicators', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('system_health');
    expect(data.system_health).toHaveProperty('database_status');
    expect(data.system_health).toHaveProperty('api_response_time');
    expect(data.system_health).toHaveProperty('memory_usage');
    expect(data.system_health).toHaveProperty('error_rate');

    expect(data).toHaveProperty('governance_health');
    expect(data.governance_health).toHaveProperty('receipt_verification_rate');
    expect(data.governance_health).toHaveProperty('hash_chain_integrity');
    expect(data.governance_health).toHaveProperty('policy_engine_status');
  });

  test('dashboard supports customizable metric views', async ({ request }) => {
    const customView = {
      metrics: ['approval_rate', 'cries_scores', 'policy_violations'],
      time_range: '7d',
      group_by: 'hour'
    };

    const response = await request.post(`${API_BASE}/dashboard/custom-view`, {
      data: customView,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('custom_metrics');
    expect(data.custom_metrics).toHaveProperty('approval_rate');
    expect(data.custom_metrics).toHaveProperty('cries_scores');
    expect(data.custom_metrics).toHaveProperty('policy_violations');
  });

  test('dashboard provides governance performance benchmarks', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/benchmarks`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('benchmarks');
    expect(data.benchmarks).toHaveProperty('evaluation_speed');
    expect(data.benchmarks).toHaveProperty('accuracy_vs_speed');
    expect(data.benchmarks).toHaveProperty('false_positive_rate');
    expect(data.benchmarks).toHaveProperty('governance_coverage');

    // Benchmarks should include industry comparisons
    expect(data).toHaveProperty('industry_comparison');
    expect(data.industry_comparison).toHaveProperty('average_accuracy');
    expect(data.industry_comparison).toHaveProperty('average_speed');
  });

  test('dashboard shows governance model performance over time', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/performance-trend`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('performance_trend');
    expect(Array.isArray(data.performance_trend)).toBeTruthy();

    if (data.performance_trend.length > 0) {
      const trendPoint = data.performance_trend[0];
      expect(trendPoint).toHaveProperty('timestamp');
      expect(trendPoint).toHaveProperty('accuracy_score');
      expect(trendPoint).toHaveProperty('response_time');
      expect(trendPoint).toHaveProperty('governance_decisions');
    }
  });

  test('dashboard provides governance compliance reporting', async ({ request }) => {
    const response = await request.get(`${API_BASE}/dashboard/compliance`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('compliance');
    expect(data.compliance).toHaveProperty('regulatory_compliance');
    expect(data.compliance).toHaveProperty('internal_policy_compliance');
    expect(data.compliance).toHaveProperty('audit_readiness_score');

    expect(data).toHaveProperty('compliance_trends');
    expect(data.compliance_trends).toHaveProperty('monthly_compliance');
    expect(data.compliance_trends).toHaveProperty('quarterly_audits');
  });

  test('dashboard supports governance alert configuration', async ({ request }) => {
    const alertConfig = {
      alert_types: ['policy_violation', 'system_degradation', 'high_error_rate'],
      thresholds: {
        policy_violation_threshold: 10,
        error_rate_threshold: 0.05,
        response_time_threshold: 2000
      },
      notification_channels: ['email', 'webhook']
    };

    const response = await request.post(`${API_BASE}/dashboard/alerts/config`, {
      data: alertConfig,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('alert_config_saved', true);
    expect(data).toHaveProperty('active_alerts');
  });

});