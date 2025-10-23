/**
 * Z-Scan Engine
 * Automated verification system for receipt chains and governance compliance
 * 
 * Scans for:
 * - Chain continuity breaks (missing receipts, hash mismatches)
 * - Lamport monotonicity violations
 * - Latency breaches (>60s)
 * - CRIES score anomalies (sudden drops)
 * - Policy violations
 * - Consensus failures
 */

import { PrismaClient } from '@/generated/prisma';
import { emitVerification } from '@/lib/receipt-emitter';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Z-Scan severity levels
export type ScanSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

// Z-Scan rule types
export type ScanRuleType = 
  | 'CHAIN_CONTINUITY'
  | 'LAMPORT_MONOTONICITY'
  | 'LATENCY_BREACH'
  | 'CRIES_ANOMALY'
  | 'POLICY_VIOLATION'
  | 'CONSENSUS_FAILURE'
  | 'HASH_INTEGRITY';

// Z-Scan result
export interface ZScanResult {
  ruleType: ScanRuleType;
  severity: ScanSeverity;
  passed: boolean;
  message: string;
  affectedReceiptId?: string;
  affectedLamportClock?: number;
  details?: Record<string, any>;
}

// Z-Scan configuration
export interface ZScanConfig {
  // Chain verification
  verifyChainContinuity: boolean;
  verifyHashIntegrity: boolean;
  
  // Timing verification
  verifyLamportMonotonicity: boolean;
  latencyThresholdSeconds: number;
  
  // Quality verification
  criesMinScore: number;
  criesDropThreshold: number; // e.g., 20 = alert if score drops >20 points
  
  // Governance verification
  verifyPolicyCompliance: boolean;
  verifyConsensus: boolean;
  consensusMinWitnesses: number;
  
  // Scan behavior
  scanIntervalMinutes: number;
  maxReceiptsPerScan: number;
}

// Default Z-Scan configuration
export const DEFAULT_ZSCAN_CONFIG: ZScanConfig = {
  verifyChainContinuity: true,
  verifyHashIntegrity: true,
  verifyLamportMonotonicity: true,
  latencyThresholdSeconds: 60,
  criesMinScore: 40,
  criesDropThreshold: 20,
  verifyPolicyCompliance: true,
  verifyConsensus: true,
  consensusMinWitnesses: 2,
  scanIntervalMinutes: 5,
  maxReceiptsPerScan: 100,
};

/**
 * Verify chain continuity - ensure no gaps in receipt chain
 */
async function verifyChainContinuity(
  userId?: number,
  limit: number = 100
): Promise<ZScanResult[]> {
  const results: ZScanResult[] = [];
  
  // Get recent receipts ordered by Lamport clock
  const receipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'asc' },
    take: limit,
  });

  if (receipts.length === 0) {
    return [{
      ruleType: 'CHAIN_CONTINUITY',
      severity: 'INFO',
      passed: true,
      message: 'No receipts found to verify',
    }];
  }

  // Check for gaps in Lamport clock sequence
  for (let i = 1; i < receipts.length; i++) {
    const prev = receipts[i - 1];
    const curr = receipts[i];
    
    const expectedClock = prev.lamportClock + 1;
    if (curr.lamportClock !== expectedClock) {
      results.push({
        ruleType: 'CHAIN_CONTINUITY',
        severity: 'CRITICAL',
        passed: false,
        message: `Chain gap detected: Lamport ${prev.lamportClock} → ${curr.lamportClock}`,
        affectedReceiptId: curr.id.toString(),
        affectedLamportClock: curr.lamportClock,
        details: {
          expectedClock,
          actualClock: curr.lamportClock,
          gap: curr.lamportClock - expectedClock,
        },
      });
    }
  }

  if (results.length === 0) {
    results.push({
      ruleType: 'CHAIN_CONTINUITY',
      severity: 'INFO',
      passed: true,
      message: `Chain continuity verified for ${receipts.length} receipts`,
    });
  }

  return results;
}

/**
 * Verify hash integrity - ensure hash chains are intact
 */
async function verifyHashIntegrity(
  userId?: number,
  limit: number = 100
): Promise<ZScanResult[]> {
  const results: ZScanResult[] = [];
  
  const receipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'asc' },
    take: limit,
  });

  if (receipts.length === 0) {
    return [{
      ruleType: 'HASH_INTEGRITY',
      severity: 'INFO',
      passed: true,
      message: 'No receipts found to verify',
    }];
  }

  for (let i = 1; i < receipts.length; i++) {
    const prev = receipts[i - 1];
    const curr = receipts[i];
    
    // Current receipt should reference previous receipt's digest
    if (curr.previousDigest !== prev.digest) {
      results.push({
        ruleType: 'HASH_INTEGRITY',
        severity: 'CRITICAL',
        passed: false,
        message: `Hash chain broken at Lamport ${curr.lamportClock}`,
        affectedReceiptId: curr.id.toString(),
        affectedLamportClock: curr.lamportClock,
        details: {
          expectedPrevDigest: prev.digest,
          actualPrevDigest: curr.previousDigest,
          previousReceiptId: prev.id,
        },
      });
    }

    // Verify self-hash is correct
    const receiptData = {
      receiptType: curr.receiptType,
      lamportClock: curr.lamportClock,
      previousDigest: curr.previousDigest,
      payload: curr.payload,
      realTimestamp: curr.realTimestamp.toISOString(),
    };
    const expectedDigest = crypto
      .createHash('sha256')
      .update(JSON.stringify(receiptData))
      .digest('hex');

    if (curr.digest !== expectedDigest) {
      results.push({
        ruleType: 'HASH_INTEGRITY',
        severity: 'CRITICAL',
        passed: false,
        message: `Receipt digest mismatch at Lamport ${curr.lamportClock}`,
        affectedReceiptId: curr.id.toString(),
        affectedLamportClock: curr.lamportClock,
        details: {
          expectedDigest,
          actualDigest: curr.digest,
        },
      });
    }
  }

  if (results.length === 0) {
    results.push({
      ruleType: 'HASH_INTEGRITY',
      severity: 'INFO',
      passed: true,
      message: `Hash integrity verified for ${receipts.length} receipts`,
    });
  }

  return results;
}

/**
 * Verify Lamport monotonicity - ensure clocks never decrease
 */
async function verifyLamportMonotonicity(
  userId?: number,
  limit: number = 100
): Promise<ZScanResult[]> {
  const results: ZScanResult[] = [];
  
  const receipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: 'asc' }, // Order by creation time, not Lamport
    take: limit,
  });

  if (receipts.length === 0) {
    return [{
      ruleType: 'LAMPORT_MONOTONICITY',
      severity: 'INFO',
      passed: true,
      message: 'No receipts found to verify',
    }];
  }

  // Check that Lamport clocks are monotonically increasing
  for (let i = 1; i < receipts.length; i++) {
    const prev = receipts[i - 1];
    const curr = receipts[i];
    
    if (curr.lamportClock < prev.lamportClock) {
      results.push({
        ruleType: 'LAMPORT_MONOTONICITY',
        severity: 'CRITICAL',
        passed: false,
        message: `Lamport clock decreased: ${prev.lamportClock} → ${curr.lamportClock}`,
        affectedReceiptId: curr.id.toString(),
        affectedLamportClock: curr.lamportClock,
        details: {
          previousClock: prev.lamportClock,
          currentClock: curr.lamportClock,
          previousReceiptId: prev.id,
        },
      });
    }
  }

  if (results.length === 0) {
    results.push({
      ruleType: 'LAMPORT_MONOTONICITY',
      severity: 'INFO',
      passed: true,
      message: `Lamport monotonicity verified for ${receipts.length} receipts`,
    });
  }

  return results;
}

/**
 * Verify latency compliance - ensure receipts emitted within threshold
 */
async function verifyLatencyCompliance(
  thresholdSeconds: number = 60,
  userId?: number,
  limit: number = 100
): Promise<ZScanResult[]> {
  const results: ZScanResult[] = [];
  
  const receipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'desc' },
    take: limit,
  });

  if (receipts.length === 0) {
    return [{
      ruleType: 'LATENCY_BREACH',
      severity: 'INFO',
      passed: true,
      message: 'No receipts found to verify',
    }];
  }

  // Check latency (timestamp in payload vs receipt creation)
  for (const receipt of receipts) {
    const payload = receipt.payload as any;
    if (payload.timestamp) {
      const eventTime = new Date(payload.timestamp);
      const receiptTime = receipt.createdAt;
      const latencyMs = receiptTime.getTime() - eventTime.getTime();
      const latencySeconds = latencyMs / 1000;

      if (latencySeconds > thresholdSeconds) {
        results.push({
          ruleType: 'LATENCY_BREACH',
          severity: latencySeconds > thresholdSeconds * 2 ? 'CRITICAL' : 'WARNING',
          passed: false,
          message: `Latency breach: ${latencySeconds.toFixed(1)}s (threshold: ${thresholdSeconds}s)`,
          affectedReceiptId: receipt.id.toString(),
          affectedLamportClock: receipt.lamportClock,
          details: {
            latencySeconds,
            thresholdSeconds,
            eventTime: eventTime.toISOString(),
            receiptTime: receiptTime.toISOString(),
          },
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      ruleType: 'LATENCY_BREACH',
      severity: 'INFO',
      passed: true,
      message: `Latency compliance verified for ${receipts.length} receipts`,
    });
  }

  return results;
}

/**
 * Verify CRIES scores - detect anomalies and low scores
 */
async function verifyCRIESScores(
  minScore: number = 40,
  dropThreshold: number = 20,
  userId?: number,
  limit: number = 100
): Promise<ZScanResult[]> {
  const results: ZScanResult[] = [];
  
  const computations = await prisma.cRIESComputation.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'asc' },
    take: limit,
  });

  if (computations.length === 0) {
    return [{
      ruleType: 'CRIES_ANOMALY',
      severity: 'INFO',
      passed: true,
      message: 'No CRIES computations found to verify',
    }];
  }

  // Check for low scores
  for (const comp of computations) {
    if (comp.criesScore < minScore) {
      results.push({
        ruleType: 'CRIES_ANOMALY',
        severity: comp.criesScore < minScore / 2 ? 'CRITICAL' : 'WARNING',
        passed: false,
        message: `Low CRIES score: ${comp.criesScore.toFixed(1)} (min: ${minScore})`,
        affectedReceiptId: comp.receiptId?.toString(),
        affectedLamportClock: comp.lamportClock,
        details: {
          criesScore: comp.criesScore,
          minScore,
          computationId: comp.id,
        },
      });
    }
  }

  // Check for sudden drops
  for (let i = 1; i < computations.length; i++) {
    const prev = computations[i - 1];
    const curr = computations[i];
    const drop = prev.criesScore - curr.criesScore;

    if (drop > dropThreshold) {
      results.push({
        ruleType: 'CRIES_ANOMALY',
        severity: drop > dropThreshold * 2 ? 'CRITICAL' : 'WARNING',
        passed: false,
        message: `CRIES score drop: ${prev.criesScore.toFixed(1)} → ${curr.criesScore.toFixed(1)} (-${drop.toFixed(1)})`,
        affectedReceiptId: curr.receiptId?.toString(),
        affectedLamportClock: curr.lamportClock,
        details: {
          previousScore: prev.criesScore,
          currentScore: curr.criesScore,
          drop,
          dropThreshold,
          previousComputationId: prev.id,
          currentComputationId: curr.id,
        },
      });
    }
  }

  if (results.length === 0) {
    results.push({
      ruleType: 'CRIES_ANOMALY',
      severity: 'INFO',
      passed: true,
      message: `CRIES scores verified for ${computations.length} computations`,
    });
  }

  return results;
}

/**
 * Verify witness consensus - ensure minimum witnesses and agreement
 */
async function verifyWitnessConsensus(
  minWitnesses: number = 2,
  userId?: number,
  limit: number = 100
): Promise<ZScanResult[]> {
  const results: ZScanResult[] = [];
  
  // Get recent receipts with witness count
  const receipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'desc' },
    take: limit,
  });

  if (receipts.length === 0) {
    return [{
      ruleType: 'CONSENSUS_FAILURE',
      severity: 'INFO',
      passed: true,
      message: 'No receipts found to verify',
    }];
  }

  for (const receipt of receipts) {
    // Get witnesses for this receipt
    const witnesses = await prisma.witnessSignature.findMany({
      where: { receiptDigest: receipt.digest },
    });
    
    // Check minimum witnesses
    if (witnesses.length < minWitnesses) {
      results.push({
        ruleType: 'CONSENSUS_FAILURE',
        severity: 'WARNING',
        passed: false,
        message: `Insufficient witnesses: ${witnesses.length} (min: ${minWitnesses})`,
        affectedReceiptId: receipt.id.toString(),
        affectedLamportClock: receipt.lamportClock,
        details: {
          receiptId: receipt.id,
          witnessCount: witnesses.length,
          minWitnesses,
        },
      });
    }

    // Check consensus (all witnesses verified)
    const unverified = witnesses.filter((w: any) => !w.verified);
    if (unverified.length > 0) {
      results.push({
        ruleType: 'CONSENSUS_FAILURE',
        severity: 'WARNING',
        passed: false,
        message: `Consensus incomplete: ${unverified.length} unverified witnesses`,
        affectedReceiptId: receipt.id.toString(),
        affectedLamportClock: receipt.lamportClock,
        details: {
          receiptId: receipt.id,
          totalWitnesses: witnesses.length,
          unverifiedCount: unverified.length,
          unverifiedModels: unverified.map((w: any) => w.modelName),
        },
      });
    }
  }

  if (results.length === 0) {
    results.push({
      ruleType: 'CONSENSUS_FAILURE',
      severity: 'INFO',
      passed: true,
      message: `Witness consensus verified for ${receipts.length} receipts`,
    });
  }

  return results;
}

/**
 * Run full Z-Scan with all verification rules
 */
export async function runZScan(
  userId?: number,
  config: Partial<ZScanConfig> = {}
): Promise<{
  scanId: number;
  totalRules: number;
  passed: number;
  warnings: number;
  critical: number;
  results: ZScanResult[];
}> {
  const finalConfig = { ...DEFAULT_ZSCAN_CONFIG, ...config };
  const allResults: ZScanResult[] = [];

  // Run all enabled verification rules
  if (finalConfig.verifyChainContinuity) {
    const results = await verifyChainContinuity(userId, finalConfig.maxReceiptsPerScan);
    allResults.push(...results);
  }

  if (finalConfig.verifyHashIntegrity) {
    const results = await verifyHashIntegrity(userId, finalConfig.maxReceiptsPerScan);
    allResults.push(...results);
  }

  if (finalConfig.verifyLamportMonotonicity) {
    const results = await verifyLamportMonotonicity(userId, finalConfig.maxReceiptsPerScan);
    allResults.push(...results);
  }

  const latencyResults = await verifyLatencyCompliance(
    finalConfig.latencyThresholdSeconds,
    userId,
    finalConfig.maxReceiptsPerScan
  );
  allResults.push(...latencyResults);

  const criesResults = await verifyCRIESScores(
    finalConfig.criesMinScore,
    finalConfig.criesDropThreshold,
    userId,
    finalConfig.maxReceiptsPerScan
  );
  allResults.push(...criesResults);

  if (finalConfig.verifyConsensus) {
    const results = await verifyWitnessConsensus(
      finalConfig.consensusMinWitnesses,
      userId,
      finalConfig.maxReceiptsPerScan
    );
    allResults.push(...results);
  }

  // Calculate summary
  const passed = allResults.filter(r => r.passed).length;
  const warnings = allResults.filter(r => !r.passed && r.severity === 'WARNING').length;
  const critical = allResults.filter(r => !r.passed && r.severity === 'CRITICAL').length;

  // Store verification results
  const verification = await prisma.zScanVerification.create({
    data: {
      userId,
      totalRules: allResults.length,
      passed,
      warnings,
      critical,
      results: allResults as any,
      config: finalConfig as any,
    },
  });

  // Emit Δ-VERIFICATION receipt
  await emitVerification(userId, {
    scanId: verification.id,
    totalRules: allResults.length,
    passed,
    warnings,
    critical,
    timestamp: new Date().toISOString(),
  });

  return {
    scanId: verification.id,
    totalRules: allResults.length,
    passed,
    warnings,
    critical,
    results: allResults,
  };
}

/**
 * Get Z-Scan history
 */
export async function getZScanHistory(
  userId?: number,
  limit: number = 50
) {
  const where = userId ? { userId } : {};
  return prisma.zScanVerification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get Z-Scan statistics
 */
export async function getZScanStats(userId?: number) {
  const where = userId ? { userId } : {};
  const scans = await prisma.zScanVerification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totalScans = scans.length;
  const totalPassed = scans.reduce((sum: number, s: any) => sum + s.passed, 0);
  const totalWarnings = scans.reduce((sum: number, s: any) => sum + s.warnings, 0);
  const totalCritical = scans.reduce((sum: number, s: any) => sum + s.critical, 0);

  const recentScans = scans.slice(0, 10);
  const avgPassed = recentScans.length > 0
    ? recentScans.reduce((sum: number, s: any) => sum + s.passed, 0) / recentScans.length
    : 0;

  return {
    totalScans,
    totalPassed,
    totalWarnings,
    totalCritical,
    recentAvgPassed: avgPassed,
    latestScan: scans[0] || null,
  };
}
