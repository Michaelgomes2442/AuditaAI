/**
 * Lamport Counter Service
 * 
 * Manages global monotonic Lamport counter for BEN Runtime.
 * Ensures counter NEVER decreases (fundamental Rosetta axiom).
 * 
 * Features:
 * - Atomic increment operations
 * - Monotonicity guarantees
 * - Receipt linking
 * - Real-time sync tracking
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface LamportState {
  currentValue: number;
  lastUpdated: Date;
  lastReceiptId: number | null;
}

export interface LamportIncrement {
  previousValue: number;
  newValue: number;
  receiptId?: number;
  timestamp: Date;
}

/**
 * Initialize Lamport counter (idempotent)
 * Creates counter if doesn't exist, returns current state otherwise
 */
export async function initializeLamportCounter(): Promise<LamportState> {
  const counter = await prisma.lamportCounter.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      currentValue: 0,
      lastUpdated: new Date(),
    },
    update: {},
  });

  return {
    currentValue: counter.currentValue,
    lastUpdated: counter.lastUpdated,
    lastReceiptId: counter.lastReceiptId,
  };
}

/**
 * Get current Lamport counter value (read-only)
 */
export async function getCurrentLamportValue(): Promise<number> {
  const counter = await prisma.lamportCounter.findUnique({
    where: { id: 1 },
  });

  if (!counter) {
    // Auto-initialize if not found
    const initialized = await initializeLamportCounter();
    return initialized.currentValue;
  }

  return counter.currentValue;
}

/**
 * Increment Lamport counter atomically
 * CRITICAL: This operation MUST be atomic to guarantee monotonicity
 * 
 * @param receiptId - Optional receipt ID to link increment
 * @returns Increment details with previous and new values
 */
export async function incrementLamportCounter(
  receiptId?: number
): Promise<LamportIncrement> {
  const result = await prisma.$transaction(async (tx) => {
    // Ensure counter exists
    const counter = await tx.lamportCounter.findUnique({
      where: { id: 1 },
    });

    if (!counter) {
      // Initialize if missing
      const initialized = await tx.lamportCounter.create({
        data: {
          id: 1,
          currentValue: 0,
          lastUpdated: new Date(),
        },
      });

      // Increment from 0 to 1
      const updated = await tx.lamportCounter.update({
        where: { id: 1 },
        data: {
          currentValue: 1,
          lastUpdated: new Date(),
          lastReceiptId: receiptId,
        },
      });

      return {
        previousValue: 0,
        newValue: 1,
        receiptId,
        timestamp: updated.lastUpdated,
      };
    }

    // Atomic increment
    const updated = await tx.lamportCounter.update({
      where: { id: 1 },
      data: {
        currentValue: { increment: 1 },
        lastUpdated: new Date(),
        lastReceiptId: receiptId,
      },
    });

    return {
      previousValue: counter.currentValue,
      newValue: updated.currentValue,
      receiptId,
      timestamp: updated.lastUpdated,
    };
  });

  return result;
}

/**
 * Increment counter by specific amount (for bulk operations)
 * WARNING: Use sparingly - prefer single increments for auditability
 */
export async function incrementLamportCounterBy(
  amount: number,
  receiptId?: number
): Promise<LamportIncrement> {
  if (amount <= 0) {
    throw new Error('Increment amount must be positive (monotonicity violation)');
  }

  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.lamportCounter.findUnique({
      where: { id: 1 },
    });

    if (!counter) {
      const initialized = await tx.lamportCounter.create({
        data: {
          id: 1,
          currentValue: amount,
          lastUpdated: new Date(),
          lastReceiptId: receiptId,
        },
      });

      return {
        previousValue: 0,
        newValue: amount,
        receiptId,
        timestamp: initialized.lastUpdated,
      };
    }

    const updated = await tx.lamportCounter.update({
      where: { id: 1 },
      data: {
        currentValue: { increment: amount },
        lastUpdated: new Date(),
        lastReceiptId: receiptId,
      },
    });

    return {
      previousValue: counter.currentValue,
      newValue: updated.currentValue,
      receiptId,
      timestamp: updated.lastUpdated,
    };
  });

  return result;
}

/**
 * Get full Lamport counter state
 */
export async function getLamportState(): Promise<LamportState> {
  const counter = await prisma.lamportCounter.findUnique({
    where: { id: 1 },
  });

  if (!counter) {
    return initializeLamportCounter();
  }

  return {
    currentValue: counter.currentValue,
    lastUpdated: counter.lastUpdated,
    lastReceiptId: counter.lastReceiptId,
  };
}

/**
 * Verify Lamport monotonicity
 * Checks that counter has never decreased
 * 
 * @returns True if monotonic, false if violations detected
 */
export async function verifyLamportMonotonicity(): Promise<{
  monotonic: boolean;
  currentValue: number;
  violations: string[];
}> {
  const counter = await prisma.lamportCounter.findUnique({
    where: { id: 1 },
  });

  if (!counter) {
    return {
      monotonic: true,
      currentValue: 0,
      violations: [],
    };
  }

  const violations: string[] = [];

  // Check that current value is non-negative
  if (counter.currentValue < 0) {
    violations.push(`Negative counter value: ${counter.currentValue}`);
  }

  // Check receipt sequence if available
  if (counter.lastReceiptId) {
    const receipts = await prisma.bENReceipt.findMany({
      orderBy: { lamportClock: 'asc' },
      take: 100, // Sample last 100 receipts
    });

    for (let i = 1; i < receipts.length; i++) {
      if (receipts[i].lamportClock <= receipts[i - 1].lamportClock) {
        violations.push(
          `Non-monotonic receipt sequence: ${receipts[i - 1].lamportClock} -> ${receipts[i].lamportClock}`
        );
      }
    }
  }

  return {
    monotonic: violations.length === 0,
    currentValue: counter.currentValue,
    violations,
  };
}

/**
 * Get Lamport-Real Hybrid Clock value
 * Combines monotonic Lamport counter with real-time UTC
 * 
 * Format: { lamport: number, utc: Date }
 */
export async function getLamportRealHybridClock(): Promise<{
  lamport: number;
  utc: Date;
  hybrid: string;
}> {
  const lamport = await getCurrentLamportValue();
  const utc = new Date();

  return {
    lamport,
    utc,
    hybrid: `L${lamport}@${utc.toISOString()}`,
  };
}

/**
 * Reserve a batch of Lamport clock values for bulk operations
 * Returns start value and guarantees next N values are reserved
 * 
 * @param count - Number of values to reserve
 * @returns Starting Lamport value for batch
 */
export async function reserveLamportBatch(count: number): Promise<{
  startValue: number;
  endValue: number;
  reserved: number;
}> {
  if (count <= 0) {
    throw new Error('Batch count must be positive');
  }

  const increment = await incrementLamportCounterBy(count);

  return {
    startValue: increment.previousValue + 1,
    endValue: increment.newValue,
    reserved: count,
  };
}
