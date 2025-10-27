import { createOptimizedPrismaClient } from './prisma-optimize.ts';
import { getCache, setCache } from './cache.js';

/**
 * Audit Logs Service - Provides governance audit trail functionality
 * Based on receipt data with filtering, pagination, and real-time streaming
 */
class AuditLogsService {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Get audit logs with comprehensive filtering and pagination
   */
  async getAuditLogs(options = {}) {
    const {
      page = 1,
      limit = 50,
      evaluationType,
      governanceDecision,
      startDate,
      endDate,
      receiptHash,
      includeCries = false,
      userId,
      sortBy = 'realTimestamp',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    // Build filters
    if (evaluationType) {
      where.receiptType = evaluationType;
    }

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (startDate || endDate) {
      where.realTimestamp = {};
      if (startDate) where.realTimestamp.gte = new Date(startDate);
      if (endDate) where.realTimestamp.lte = new Date(endDate);
    }

    if (receiptHash) {
      where.digest = receiptHash;
    }

    // Governance decision filtering (based on receipt payload)
    let governanceFilter = null;
    if (governanceDecision) {
      governanceFilter = governanceDecision;
    }

    // Get total count
    const total = await this.prisma.bENReceipt.count({ where });

    // Get receipts with pagination
    const receipts = await this.prisma.bENReceipt.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        receiptType: true,
        lamportClock: true,
        realTimestamp: true,
        digest: true,
        previousDigest: true,
        witnessModel: true,
        payload: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Transform receipts into audit log format
    const logs = receipts.map(receipt => this.transformReceiptToAuditLog(receipt, includeCries));

    // Apply governance decision filter if specified
    let filteredLogs = logs;
    if (governanceFilter) {
      filteredLogs = logs.filter(log => {
        if (governanceFilter === 'approved') {
          return log.governance_decision === 'approved' || !log.policy_violations?.length;
        }
        if (governanceFilter === 'rejected') {
          return log.governance_decision === 'rejected' || log.policy_violations?.length > 0;
        }
        return true;
      });
    }

    return {
      logs: filteredLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        evaluationType,
        governanceDecision,
        startDate,
        endDate,
        receiptHash,
        includeCries,
        userId
      }
    };
  }

  /**
   * Transform receipt data into audit log format
   */
  transformReceiptToAuditLog(receipt, includeCries = false) {
    const payload = receipt.payload || {};
    const cries = payload.cries || {};

    const log = {
      id: receipt.id,
      timestamp: receipt.realTimestamp,
      evaluation_type: receipt.receiptType.toLowerCase(),
      receipt_id: receipt.id,
      receipt_hash: receipt.digest,
      model: receipt.witnessModel || payload.model || 'unknown',
      user_id: receipt.userId,
      user: receipt.user,
      conversation_id: payload.conversation_id || 'default',
      prompt_length: payload.prompt ? payload.prompt.length : 0,
      response_length: payload.response ? payload.response.length : 0,
      governance_decision: this.determineGovernanceDecision(payload),
      policy_violations: this.extractPolicyViolations(payload),
      risk_flags: payload.risk_flags || [],
      trace_id: payload.trace_id || `TRACE-${receipt.id}`,
      lamport_clock: receipt.lamportClock
    };

    if (includeCries) {
      log.cries_metrics = {
        coherence: cries.C || 0,
        reliability: cries.R || 0,
        integrity: cries.I || 0,
        effectiveness: cries.E || 0,
        security: cries.S || 0,
        overall: cries.overall || 0
      };
    }

    return log;
  }

  /**
   * Determine governance decision from receipt payload
   */
  determineGovernanceDecision(payload) {
    // Check if response indicates blocking
    if (payload.response && payload.response.includes('BLOCKED:')) {
      return 'rejected';
    }

    // Check for policy violations
    if (payload.policies && payload.policies.length > 0) {
      const hasBlocks = payload.policies.some(p => p.action === 'block');
      if (hasBlocks) return 'rejected';
    }

    // Check risk flags
    if (payload.risk_flags && payload.risk_flags.length > 0) {
      return 'flagged';
    }

    return 'approved';
  }

  /**
   * Extract policy violations from receipt payload
   */
  extractPolicyViolations(payload) {
    if (!payload.policies) return [];

    return payload.policies
      .filter(p => p.action === 'block' || p.action === 'flag')
      .map(p => ({
        rule: p.rule || 'unknown',
        reason: p.reason || 'Policy violation',
        severity: p.severity || 'medium'
      }));
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(options = {}) {
    const { startDate, endDate, userId } = options;

    const where = {};
    if (startDate || endDate) {
      where.realTimestamp = {};
      if (startDate) where.realTimestamp.gte = new Date(startDate);
      if (endDate) where.realTimestamp.lte = new Date(endDate);
    }
    if (userId) {
      where.userId = parseInt(userId);
    }

    // Get basic counts
    const [totalLogs, approvedLogs, rejectedLogs, flaggedLogs] = await Promise.all([
      this.prisma.bENReceipt.count({
        where,
        cacheStrategy: {
          swr: 60, // Stale-while-revalidating for 60 seconds
          ttl: 60, // Cache results for 60 seconds
        }
      }),
      this.prisma.bENReceipt.count({
        where: {
          ...where,
          payload: { path: ['response'], not: { string_contains: 'BLOCKED:' } }
        },
        cacheStrategy: {
          swr: 60, // Stale-while-revalidating for 60 seconds
          ttl: 60, // Cache results for 60 seconds
        }
      }),
      this.prisma.bENReceipt.count({
        where: {
          ...where,
          payload: { path: ['response'], string_contains: 'BLOCKED:' }
        },
        cacheStrategy: {
          swr: 60, // Stale-while-revalidating for 60 seconds
          ttl: 60, // Cache results for 60 seconds
        }
      }),
      this.prisma.bENReceipt.count({
        where: {
          ...where,
          payload: { path: ['risk_flags'], array_contains: [] }
        },
        cacheStrategy: {
          swr: 60, // Stale-while-revalidating for 60 seconds
          ttl: 60, // Cache results for 60 seconds
        }
      })
    ]);

    // Get CRIES averages (cache this aggregate for short periods to reduce DB load)
    const cacheKey = `audit:stats:avgLamport:${JSON.stringify(where)}`;
    let criesStats = await getCache(cacheKey);
    if (!criesStats) {
      criesStats = await this.prisma.bENReceipt.aggregate({
        where,
        _avg: {
          lamportClock: true
        }
      });
      // Cache for 60 seconds (stale-while-revalidate style can be implemented by returning cached then refreshing in background)
      await setCache(cacheKey, criesStats, 60);
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await this.prisma.bENReceipt.count({
      where: {
        ...where,
        realTimestamp: { gte: yesterday }
      }
    });

    return {
      total_logs: totalLogs,
      approved_logs: approvedLogs,
      rejected_logs: rejectedLogs,
      flagged_logs: flaggedLogs,
      approval_rate: totalLogs > 0 ? (approvedLogs / totalLogs * 100).toFixed(2) : 0,
      recent_activity_24h: recentLogs,
      average_lamport_clock: criesStats._avg.lamportClock || 0
    };
  }

  /**
   * Export audit logs in various formats
   */
  async exportAuditLogs(options = {}) {
    const { format = 'json', ...filterOptions } = options;

    // Get all logs without pagination
    const result = await this.getAuditLogs({ ...filterOptions, page: 1, limit: 10000 });

    switch (format) {
      case 'json':
        return JSON.stringify(result.logs, null, 2);

      case 'csv':
        return this.convertLogsToCSV(result.logs);

      case 'ndjson':
        return result.logs.map(log => JSON.stringify(log)).join('\n');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert logs to CSV format
   */
  convertLogsToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]);
    const csvRows = [
      headers.join(','),
      ...logs.map(log =>
        headers.map(header => {
          const value = log[header];
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Search logs by receipt hash
   */
  async searchByReceiptHash(hash) {
    const receipt = await this.prisma.bENReceipt.findFirst({
      where: { digest: hash },
      select: {
        id: true,
        receiptType: true,
        lamportClock: true,
        realTimestamp: true,
        digest: true,
        payload: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!receipt) return null;

    return this.transformReceiptToAuditLog(receipt, true);
  }

  /**
   * Get logs for real-time streaming (SSE)
   */
  async getRecentLogsForStreaming(sinceTimestamp = null, limit = 50) {
    const where = {};
    if (sinceTimestamp) {
      where.realTimestamp = { gt: new Date(sinceTimestamp) };
    }

    const receipts = await this.prisma.bENReceipt.findMany({
      where,
      orderBy: { realTimestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        receiptType: true,
        realTimestamp: true,
        digest: true,
        payload: true,
        userId: true
      }
    });

    return receipts.map(receipt => this.transformReceiptToAuditLog(receipt));
  }
}

// Export class for instantiation with prisma client
export { AuditLogsService };
export default AuditLogsService;