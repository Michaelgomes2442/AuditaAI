/**
 * Hybrid Clock Service
 * Combines Lamport logical clocks with wall-clock (UTC) timestamps
 * 
 * Features:
 * - Lamport counter (monotonic logical time)
 * - UTC timestamps (physical time)
 * - Clock drift detection
 * - Synchronization across nodes
 * - Total ordering guarantee
 * 
 * Based on Hybrid Logical Clocks (HLC) from CockroachDB/Spanner
 */

import { PrismaClient } from '@/generated/prisma';
import { incrementLamportCounter } from './lamport-counter';

const prisma = new PrismaClient();

// Hybrid timestamp combining logical and physical time
export interface HybridTimestamp {
  lamport: number;        // Logical clock (monotonic)
  wallClock: Date;        // Physical time (UTC)
  drift: number;          // Clock drift in milliseconds
  node: string;           // Node identifier
}

// Clock synchronization result
export interface ClockSyncResult {
  localClock: HybridTimestamp;
  remoteClock?: HybridTimestamp;
  driftMs: number;
  synchronized: boolean;
  correctionApplied: boolean;
}

// Maximum allowed clock drift before correction (5 seconds)
const MAX_DRIFT_MS = 5000;

// Node identifier (in production, use machine/pod ID)
const NODE_ID = process.env.NODE_ID || 'node-1';

/**
 * Get current hybrid timestamp
 * Combines Lamport counter with UTC timestamp
 */
export async function getCurrentHybridTime(): Promise<HybridTimestamp> {
  const lamportResult = await incrementLamportCounter();
  const wallClock = new Date();
  
  return {
    lamport: lamportResult.newValue,
    wallClock,
    drift: 0,
    node: NODE_ID,
  };
}

/**
 * Merge two hybrid timestamps (for distributed coordination)
 * Takes the maximum of both logical and physical time
 */
export function mergeHybridTimestamps(
  local: HybridTimestamp,
  remote: HybridTimestamp
): HybridTimestamp {
  // Take max of both clocks
  const maxLamport = Math.max(local.lamport, remote.lamport) + 1;
  const maxWallClock = new Date(Math.max(
    local.wallClock.getTime(),
    remote.wallClock.getTime()
  ));
  
  // Calculate drift
  const drift = Math.abs(
    local.wallClock.getTime() - remote.wallClock.getTime()
  );
  
  return {
    lamport: maxLamport,
    wallClock: maxWallClock,
    drift,
    node: local.node,
  };
}

/**
 * Compare two hybrid timestamps
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareHybridTimestamps(
  a: HybridTimestamp,
  b: HybridTimestamp
): number {
  // First compare Lamport clocks (logical time)
  if (a.lamport < b.lamport) return -1;
  if (a.lamport > b.lamport) return 1;
  
  // If Lamport equal, compare wall clocks (physical time)
  const aTime = a.wallClock.getTime();
  const bTime = b.wallClock.getTime();
  if (aTime < bTime) return -1;
  if (aTime > bTime) return 1;
  
  // If both equal, compare node IDs (for determinism)
  if (a.node < b.node) return -1;
  if (a.node > b.node) return 1;
  
  return 0;
}

/**
 * Detect clock drift between local and remote clocks
 */
export function detectClockDrift(
  local: HybridTimestamp,
  remote: HybridTimestamp
): {
  driftMs: number;
  driftSeconds: number;
  exceedsThreshold: boolean;
  message: string;
} {
  const driftMs = Math.abs(
    local.wallClock.getTime() - remote.wallClock.getTime()
  );
  const driftSeconds = driftMs / 1000;
  const exceedsThreshold = driftMs > MAX_DRIFT_MS;
  
  let message = '';
  if (exceedsThreshold) {
    message = `Clock drift exceeds threshold: ${driftSeconds.toFixed(2)}s (max: ${MAX_DRIFT_MS / 1000}s)`;
  } else {
    message = `Clock drift within acceptable range: ${driftSeconds.toFixed(2)}s`;
  }
  
  return {
    driftMs,
    driftSeconds,
    exceedsThreshold,
    message,
  };
}

/**
 * Synchronize clock with remote node
 * Applies correction if drift exceeds threshold
 */
export async function synchronizeClocks(
  remoteClock: HybridTimestamp
): Promise<ClockSyncResult> {
  const localClock = await getCurrentHybridTime();
  const drift = detectClockDrift(localClock, remoteClock);
  
  let correctionApplied = false;
  let synchronized = !drift.exceedsThreshold;
  
  if (drift.exceedsThreshold) {
    // Apply correction by merging clocks
    const correctedClock = mergeHybridTimestamps(localClock, remoteClock);
    
    // Update local Lamport counter to match
    await prisma.lamportCounter.update({
      where: { id: 1 },
      data: { 
        currentValue: correctedClock.lamport,
        lastUpdated: new Date(),
      },
    });
    
    correctionApplied = true;
    synchronized = true;
  }
  
  return {
    localClock,
    remoteClock,
    driftMs: drift.driftMs,
    synchronized,
    correctionApplied,
  };
}

/**
 * Encode hybrid timestamp as string (for storage/transmission)
 * Format: L{lamport}@{iso-timestamp}#{node}
 */
export function encodeHybridTimestamp(ht: HybridTimestamp): string {
  return `L${ht.lamport}@${ht.wallClock.toISOString()}#${ht.node}`;
}

/**
 * Decode hybrid timestamp from string
 */
export function decodeHybridTimestamp(encoded: string): HybridTimestamp {
  const match = encoded.match(/^L(\d+)@(.+?)#(.+)$/);
  if (!match) {
    throw new Error(`Invalid hybrid timestamp format: ${encoded}`);
  }
  
  return {
    lamport: parseInt(match[1]),
    wallClock: new Date(match[2]),
    drift: 0,
    node: match[3],
  };
}

/**
 * Generate clock attestation (proof of timestamp)
 * Used in receipts for verifiable time
 */
export function generateClockAttestation(
  ht: HybridTimestamp,
  receiptDigest: string
): {
  timestamp: HybridTimestamp;
  attestation: string;
  receiptDigest: string;
} {
  const encoded = encodeHybridTimestamp(ht);
  const attestation = `${encoded}::${receiptDigest}`;
  
  return {
    timestamp: ht,
    attestation,
    receiptDigest,
  };
}

/**
 * Verify clock attestation
 */
export function verifyClockAttestation(
  attestation: string,
  receiptDigest: string
): {
  valid: boolean;
  timestamp?: HybridTimestamp;
  message: string;
} {
  const parts = attestation.split('::');
  if (parts.length !== 2) {
    return {
      valid: false,
      message: 'Invalid attestation format',
    };
  }
  
  const [encodedTimestamp, attestedDigest] = parts;
  
  if (attestedDigest !== receiptDigest) {
    return {
      valid: false,
      message: 'Receipt digest mismatch',
    };
  }
  
  try {
    const timestamp = decodeHybridTimestamp(encodedTimestamp);
    return {
      valid: true,
      timestamp,
      message: 'Attestation verified',
    };
  } catch (error: any) {
    return {
      valid: false,
      message: `Attestation decode failed: ${error.message}`,
    };
  }
}

/**
 * Get time range between two hybrid timestamps
 */
export function getTimeRange(
  start: HybridTimestamp,
  end: HybridTimestamp
): {
  lamportRange: number;
  wallClockRangeMs: number;
  wallClockRangeSeconds: number;
  averageDrift: number;
} {
  const lamportRange = end.lamport - start.lamport;
  const wallClockRangeMs = end.wallClock.getTime() - start.wallClock.getTime();
  const wallClockRangeSeconds = wallClockRangeMs / 1000;
  const averageDrift = (start.drift + end.drift) / 2;
  
  return {
    lamportRange,
    wallClockRangeMs,
    wallClockRangeSeconds,
    averageDrift,
  };
}

/**
 * Check if timestamp is within acceptable drift range
 */
export function isTimestampValid(
  ht: HybridTimestamp,
  maxDriftMs: number = MAX_DRIFT_MS
): {
  valid: boolean;
  reason?: string;
} {
  // Check if wall clock is too far in the future
  const now = new Date();
  const futureMs = ht.wallClock.getTime() - now.getTime();
  
  if (futureMs > maxDriftMs) {
    return {
      valid: false,
      reason: `Timestamp too far in future: ${(futureMs / 1000).toFixed(2)}s`,
    };
  }
  
  // Check if timestamp drift is excessive
  if (ht.drift > maxDriftMs) {
    return {
      valid: false,
      reason: `Excessive clock drift: ${(ht.drift / 1000).toFixed(2)}s`,
    };
  }
  
  return { valid: true };
}

/**
 * Format hybrid timestamp for display
 */
export function formatHybridTimestamp(ht: HybridTimestamp): string {
  const wallTime = ht.wallClock.toLocaleString();
  const drift = ht.drift > 0 ? ` (drift: ${(ht.drift / 1000).toFixed(2)}s)` : '';
  return `L${ht.lamport} @ ${wallTime}${drift}`;
}

/**
 * Get hybrid clock statistics for a user
 */
export async function getHybridClockStats(userId?: number) {
  const counter = await prisma.lamportCounter.findUnique({
    where: { id: 1 },
  });
  
  const currentHybridTime = await getCurrentHybridTime();
  
  // Get recent receipts to analyze clock behavior
  const recentReceipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'desc' },
    take: 100,
  });
  
  // Calculate average time between receipts (physical time)
  let totalTimeMs = 0;
  let totalLamportDiff = 0;
  
  for (let i = 1; i < recentReceipts.length; i++) {
    const prev = recentReceipts[i];
    const curr = recentReceipts[i - 1];
    
    const timeMs = curr.realTimestamp.getTime() - prev.realTimestamp.getTime();
    const lamportDiff = curr.lamportClock - prev.lamportClock;
    
    totalTimeMs += timeMs;
    totalLamportDiff += lamportDiff;
  }
  
  const avgTimeBetweenEvents = recentReceipts.length > 1
    ? totalTimeMs / (recentReceipts.length - 1)
    : 0;
    
  const avgLamportIncrement = recentReceipts.length > 1
    ? totalLamportDiff / (recentReceipts.length - 1)
    : 1;
  
  return {
    currentLamport: counter?.currentValue || 0,
    currentWallClock: currentHybridTime.wallClock,
    currentHybridTime,
    totalReceipts: recentReceipts.length,
    avgTimeBetweenEventsMs: avgTimeBetweenEvents,
    avgTimeBetweenEventsSeconds: avgTimeBetweenEvents / 1000,
    avgLamportIncrement,
    node: NODE_ID,
  };
}
