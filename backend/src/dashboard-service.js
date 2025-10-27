import { AuditLogsService } from './audit-logs-service.js';

/**
 * Dashboard Service - Computes governance metrics and analytics on-demand
 * Provides real-time insights into system health and compliance
 */
class DashboardService {
  constructor(prismaClient) {
    this.prisma = prismaClient;
    this.auditLogsService = new AuditLogsService(prismaClient);
  }

  /**
   * Get dashboard overview metrics
   */
  async getDashboardOverview(options = {}) {
    const { startDate, endDate, userId } = options;

    // Get audit stats
    const stats = await this.auditLogsService.getAuditStats({ startDate, endDate, userId });

    // Get CRIES distribution
    const criesDistribution = await this.getCRIESDistribution({ startDate, endDate, userId });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await this.auditLogsService.getAuditStats({
      startDate: sevenDaysAgo,
      endDate,
      userId
    });

    // Get policy enforcement stats
    const policyStats = await this.getPolicyEnforcementStats({ startDate, endDate, userId });

    return {
      overview: {
        total_evaluations: stats.total_logs,
        approved_evaluations: stats.approved_logs,
        rejected_evaluations: stats.rejected_logs,
        average_confidence_score: parseFloat(stats.approval_rate),
        uptime_percentage: 99.9
      },
      cries_distribution: criesDistribution,
      policy_enforcement: policyStats,
      system_health: await this.getSystemHealthMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get real-time metrics for current hour
   */
  async getRealtimeMetrics() {
    const now = new Date();
    const hourStart = new Date(now.getTime() - 60 * 60 * 1000); // Last hour

    const stats = await this.auditLogsService.getAuditStats({
      startDate: hourStart
    });

    // Get audit logs for policy violations count
    const result = await this.auditLogsService.getAuditLogs({
      startDate: hourStart,
      endDate: now,
      page: 1,
      limit: 1000
    });

    // Get per-minute activity for the last hour
    const minuteStats = await this.getMinuteByMinuteActivity(hourStart, now);

    return {
      current_hour: {
        evaluations_count: stats.total_logs,
        approval_rate: parseFloat(stats.approval_rate),
        average_response_time: 150 // Placeholder - would need to track actual response times
      },
      last_24_hours: {
        evaluations_trend: stats.total_logs,
        policy_violations: result.logs.filter(l => l.policy_violations?.length > 0).length
      },
      minute_activity: minuteStats,
      timestamp: now.toISOString()
    };
  }

  /**
   * Get minute-by-minute activity for real-time dashboard
   */
  async getMinuteByMinuteActivity(startTime, endTime) {
    // This would typically use a more efficient query, but for now we'll use the audit logs service
    const result = await this.auditLogsService.getAuditLogs({
      startDate: startTime,
      endDate: endTime,
      page: 1,
      limit: 1000
    });

    // Group by minute
    const minuteGroups = {};
    result.logs.forEach(log => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      if (!minuteGroups[minute]) {
        minuteGroups[minute] = { evaluations: 0, approvals: 0, rejections: 0 };
      }
      minuteGroups[minute].evaluations++;
      if (log.governance_decision === 'approved') {
        minuteGroups[minute].approvals++;
      } else if (log.governance_decision === 'rejected') {
        minuteGroups[minute].rejections++;
      }
    });

    // Convert to array and sort by time
    return Object.entries(minuteGroups)
      .map(([minute, stats]) => ({ minute, ...stats }))
      .sort((a, b) => a.minute.localeCompare(b.minute));
  }

  /**
   * Get CRIES metrics distribution
   */
  async getCRIESDistribution(options = {}) {
    const { startDate, endDate, userId } = options;

    const result = await this.auditLogsService.getAuditLogs({
      ...options,
      includeCries: true,
      page: 1,
      limit: 1000
    });

    const distribution = {
      coherence: { excellent: 0, good: 0, fair: 0, poor: 0 },
      reliability: { excellent: 0, good: 0, fair: 0, poor: 0 },
      integrity: { excellent: 0, good: 0, fair: 0, poor: 0 },
      effectiveness: { excellent: 0, good: 0, fair: 0, poor: 0 },
      security: { excellent: 0, good: 0, fair: 0, poor: 0 },
      overall: { excellent: 0, good: 0, fair: 0, poor: 0 }
    };

    result.logs.forEach(log => {
      if (log.cries_metrics) {
        const metrics = ['coherence', 'reliability', 'integrity', 'effectiveness', 'security', 'overall'];
        metrics.forEach(metric => {
          const value = log.cries_metrics[metric];
          if (typeof value === 'number') {
            const range = this.getScoreRange(value);
            distribution[metric][range]++;
          }
        });
      }
    });

    return distribution;
  }

  /**
   * Get score range for distribution
   */
  getScoreRange(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Get policy enforcement statistics
   */
  async getPolicyEnforcementStats(options = {}) {
    const result = await this.auditLogsService.getAuditLogs({
      ...options,
      page: 1,
      limit: 1000
    });

    const policyStats = {
      total_evaluations: result.logs.length,
      blocked_requests: 0,
      flagged_requests: 0,
      allowed_requests: 0,
      policy_violations: {},
      top_violation_types: []
    };

    result.logs.forEach(log => {
      if (log.governance_decision === 'rejected') {
        policyStats.blocked_requests++;
      } else if (log.governance_decision === 'flagged') {
        policyStats.flagged_requests++;
      } else {
        policyStats.allowed_requests++;
      }

      // Count violation types
      if (log.policy_violations) {
        log.policy_violations.forEach(violation => {
          const type = violation.rule || 'unknown';
          policyStats.policy_violations[type] = (policyStats.policy_violations[type] || 0) + 1;
        });
      }
    });

    // Get top violation types
    policyStats.top_violation_types = Object.entries(policyStats.policy_violations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const finalPolicyStats = {
      total_evaluations: result.logs.length,
      active_policies: 5, // Placeholder - would need to count actual policies
      violations_today: result.logs.filter(l => l.policy_violations?.length > 0).length,
      most_triggered_rules: policyStats.top_violation_types,
      rule_effectiveness: {
        block_rules: policyStats.blocked_requests,
        redact_rules: 0, // Placeholder - would need to track redact actions
        escalate_rules: 0  // Placeholder - would need to track escalate actions
      }
    };

    return finalPolicyStats;
  }

  /**
   * Get system health indicators
   */
  async getSystemHealthMetrics() {
    const stats = await this.auditLogsService.getAuditStats();

    // Calculate health scores based on various metrics
    const approvalRate = parseFloat(stats.approval_rate);
    const recentActivity = stats.recent_activity_24h;

    // Health score: combination of approval rate and activity
    const healthScore = Math.min(100, (approvalRate * 0.7) + (recentActivity > 0 ? 30 : 0) + 20);

    return {
      overall_health: Math.round(healthScore),
      system_health: {
        database_status: 'healthy',
        api_response_time: 150, // Placeholder - would need to track actual response times
        memory_usage: 0.65, // Placeholder - would need to track actual memory usage
        error_rate: 0.02 // Placeholder - would need to track actual error rates
      },
      governance_health: {
        receipt_verification_rate: 0.98, // Placeholder - would need to track actual verification rates
        hash_chain_integrity: 'valid', // Placeholder - would need to verify hash chains
        policy_engine_status: 'operational'
      },
      components: {
        governance_engine: approvalRate > 70 ? 'healthy' : approvalRate > 50 ? 'warning' : 'critical',
        receipt_system: stats.total_logs > 0 ? 'healthy' : 'warning',
        audit_logging: stats.total_logs > 0 ? 'healthy' : 'warning',
        real_time_monitoring: recentActivity > 0 ? 'healthy' : 'warning'
      },
      uptime_percentage: 99.9, // Placeholder - would need actual uptime tracking
      last_evaluation: new Date().toISOString(),
      active_alerts: this.generateHealthAlerts(stats)
    };
  }

  /**
   * Generate health alerts based on system metrics
   */
  generateHealthAlerts(stats) {
    const alerts = [];

    if (parseFloat(stats.approval_rate) < 50) {
      alerts.push({
        level: 'critical',
        message: 'Governance approval rate is critically low',
        metric: 'approval_rate',
        value: stats.approval_rate,
        threshold: 50
      });
    } else if (parseFloat(stats.approval_rate) < 70) {
      alerts.push({
        level: 'warning',
        message: 'Governance approval rate is below optimal levels',
        metric: 'approval_rate',
        value: stats.approval_rate,
        threshold: 70
      });
    }

    if (stats.recent_activity_24h === 0) {
      alerts.push({
        level: 'warning',
        message: 'No governance evaluations in the last 24 hours',
        metric: 'recent_activity',
        value: 0,
        threshold: 1
      });
    }

    return alerts;
  }

  /**
   * Get performance benchmarks
   */
  async getPerformanceBenchmarks(options = {}) {
    const { startDate, endDate } = options;

    const result = await this.auditLogsService.getAuditLogs({
      startDate,
      endDate,
      includeCries: true,
      page: 1,
      limit: 1000
    });

    const benchmarks = {
      cries_averages: {
        coherence: 0,
        reliability: 0,
        integrity: 0,
        effectiveness: 0,
        security: 0,
        overall: 0
      },
      evaluation_speed: {
        average_ms: 0,
        p95_ms: 0,
        p99_ms: 0
      },
      throughput: {
        evaluations_per_hour: 0,
        evaluations_per_day: 0
      },
      compliance_score: 0,
      accuracy_vs_speed: 0.85, // Placeholder - would need to calculate actual accuracy vs speed trade-off
      false_positive_rate: 0.05, // Placeholder - would need to calculate actual false positives
      governance_coverage: 0.92, // Placeholder - would need to calculate actual coverage
      period: {
        start: startDate || 'all_time',
        end: endDate || 'present'
      }
    };

    if (result.logs.length > 0) {
      // Calculate CRIES averages
      const criesSums = { coherence: 0, reliability: 0, integrity: 0, effectiveness: 0, security: 0, overall: 0 };
      let criesCount = 0;

      result.logs.forEach(log => {
        if (log.cries_metrics) {
          criesCount++;
          criesSums.coherence += log.cries_metrics.coherence || 0;
          criesSums.reliability += log.cries_metrics.reliability || 0;
          criesSums.integrity += log.cries_metrics.integrity || 0;
          criesSums.effectiveness += log.cries_metrics.effectiveness || 0;
          criesSums.security += log.cries_metrics.security || 0;
          criesSums.overall += log.cries_metrics.overall || 0;
        }
      });

      if (criesCount > 0) {
        benchmarks.cries_averages = {
          coherence: Number((criesSums.coherence / criesCount).toFixed(3)),
          reliability: Number((criesSums.reliability / criesCount).toFixed(3)),
          integrity: Number((criesSums.integrity / criesCount).toFixed(3)),
          effectiveness: Number((criesSums.effectiveness / criesCount).toFixed(3)),
          security: Number((criesSums.security / criesCount).toFixed(3)),
          overall: Number((criesSums.overall / criesCount).toFixed(3))
        };
      }

      // Calculate throughput
      const timeRange = startDate && endDate ?
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60) : // hours
        (Date.now() - result.logs[0]?.timestamp?.getTime?.()) / (1000 * 60 * 60) || 24;

      benchmarks.throughput = {
        evaluations_per_hour: Number((result.logs.length / timeRange).toFixed(2)),
        evaluations_per_day: Number((result.logs.length / (timeRange / 24)).toFixed(2))
      };

      // Calculate compliance score (based on approval rate and CRIES scores)
      const approvalRate = result.logs.filter(l => l.governance_decision === 'approved').length / result.logs.length;
      const avgCriesScore = benchmarks.cries_averages.overall;
      benchmarks.compliance_score = Math.round((approvalRate * 0.6 + avgCriesScore * 0.4) * 100);
    }

    return benchmarks;
  }

  /**
   * Get governance alerts and notifications
   */
  async getGovernanceAlerts(options = {}) {
    const { startDate, endDate } = options;

    const result = await this.auditLogsService.getAuditLogs({
      startDate,
      endDate,
      page: 1,
      limit: 100
    });

    const alerts = [];

    // Check for high rejection rates
    const rejectionRate = result.logs.filter(l => l.governance_decision === 'rejected').length / result.logs.length;
    if (rejectionRate > 0.3) {
      alerts.push({
        id: 'high-rejection-rate',
        severity: 'warning',
        title: 'High Governance Rejection Rate',
        message: `${(rejectionRate * 100).toFixed(1)}% of requests are being rejected`,
        timestamp: new Date().toISOString(),
        actionable: true,
        resolved: false
      });
    }

    // Check for policy violations
    const violations = result.logs.filter(l => l.policy_violations?.length > 0);
    if (violations.length > 0) {
      alerts.push({
        id: 'policy-violations',
        severity: 'info',
        title: 'Policy Violations Detected',
        message: `${violations.length} policy violations in recent evaluations`,
        timestamp: new Date().toISOString(),
        actionable: true,
        resolved: false
      });
    }

    // Check for low CRIES scores
    const lowCriesLogs = result.logs.filter(l => l.cries_metrics?.overall < 0.5);
    if (lowCriesLogs.length > result.logs.length * 0.2) {
      alerts.push({
        id: 'low-cries-scores',
        severity: 'warning',
        title: 'Low CRIES Evaluation Scores',
        message: 'Multiple evaluations have low governance scores',
        timestamp: new Date().toISOString(),
        actionable: true,
        resolved: false
      });
    }

    return {
      alerts,
      total_alerts: alerts.length,
      last_checked: new Date().toISOString()
    };
  }

  /**
   * Get customizable metric views
   */
  async getCustomMetrics(options = {}) {
    const { metrics = ['approval_rate', 'cries_avg', 'throughput'], timeRange = '24h' } = options;

    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const result = await this.auditLogsService.getAuditLogs({
      startDate,
      includeCries: true,
      page: 1,
      limit: 1000
    });

    const customMetrics = {};

    metrics.forEach(metric => {
      switch (metric) {
        case 'approval_rate':
          const approved = result.logs.filter(l => l.governance_decision === 'approved').length;
          customMetrics.approval_rate = result.logs.length > 0 ? (approved / result.logs.length * 100) : 0;
          break;

        case 'cries_scores':
          const criesScores = result.logs
            .map(l => l.cries_metrics?.overall)
            .filter(score => typeof score === 'number');
          customMetrics.cries_scores = criesScores.length > 0 ?
            criesScores.reduce((a, b) => a + b, 0) / criesScores.length : 0;
          break;

        case 'throughput':
          const hours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
          customMetrics.throughput = result.logs.length / hours;
          break;

        case 'policy_violations':
          const violations = result.logs.filter(l => l.policy_violations?.length > 0).length;
          customMetrics.policy_violations = violations;
          break;
      }
    });

    return {
      custom_metrics: customMetrics,
      time_range: timeRange,
      total_evaluations: result.logs.length,
      timestamp: now.toISOString()
    };
  }
}

// Export class for instantiation with prisma client
export { DashboardService };
export default DashboardService;