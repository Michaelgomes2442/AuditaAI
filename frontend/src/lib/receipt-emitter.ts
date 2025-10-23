/**
 * Receipt Emitter Service
 * 
 * Generates and emits Δ-Receipts for BEN Runtime state machine.
 * All state changes in Rosetta Cognitive Governance OS emit receipts.
 * 
 * Receipt Types:
 * - Δ-BOOTCONFIRM: System initialization
 * - Δ-ANALYSIS: BEN Core computations (CRIES, σ-windows, τ-thresholds)
 * - Δ-DIRECTIVE: Governance commands from AuditaAI to humans
 * - Δ-RESULT: Execution outcomes from humans back to system
 * - Δ-APPEND: State mutations with integrity proofs
 * - Δ-SYNCPOINT: Coordination markers for session continuity
 */

import { PrismaClient, ReceiptType, BENPersona, TrackType } from '@/generated/prisma';
import { incrementLamportCounter } from './lamport-counter';
import { getCurrentHybridTime, generateClockAttestation, encodeHybridTimestamp } from './hybrid-clock';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface ReceiptPayload {
  type: ReceiptType;
  persona: BENPersona;
  track?: TrackType;
  data: Record<string, any>;
  userId?: number;
  witnessModel?: string;
}

export interface EmittedReceipt {
  id: number;
  receiptType: ReceiptType;
  lamportClock: number;
  realTimestamp: Date;
  digest: string;
  previousDigest: string | null;
  witnessSignature: string | null;
}

/**
 * Compute SHA-256 digest of receipt content
 * Canonical projection: deterministic hash discipline
 */
export function computeReceiptDigest(
  receiptType: ReceiptType,
  lamportClock: number,
  payload: Record<string, any>,
  previousDigest: string | null
): string {
  // Canonical JSON serialization (sorted keys)
  const canonical = JSON.stringify(
    {
      type: receiptType,
      lamport: lamportClock,
      payload,
      previous: previousDigest,
    },
    Object.keys({
      type: receiptType,
      lamport: lamportClock,
      payload,
      previous: previousDigest,
    }).sort()
  );

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Get last receipt digest for digest chain linking
 */
async function getLastReceiptDigest(userId?: number): Promise<string | null> {
  const lastReceipt = await prisma.bENReceipt.findFirst({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'desc' },
    select: { digest: true },
  });

  return lastReceipt?.digest || null;
}

/**
 * Get baseline digest for anchoring
 */
async function getBaselineDigest(): Promise<string | null> {
  const baseline = await prisma.bENReceipt.findFirst({
    where: { receiptType: 'BOOT_CONFIRM' },
    orderBy: { lamportClock: 'asc' },
    select: { digest: true },
  });

  return baseline?.digest || null;
}

/**
 * Generate witness signature from model
 * In production, this would call actual LLM for attestation
 */
function generateWitnessSignature(
  modelName: string,
  receiptDigest: string,
  lamportClock: number
): string {
  // Mock signature for now - in production, call LLM witness API
  const signatureData = {
    model: modelName,
    digest: receiptDigest,
    lamport: lamportClock,
    timestamp: new Date().toISOString(),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(signatureData))
    .digest('hex');
}

/**
 * Emit a BEN Receipt
 * This is the core state transition mechanism for Rosetta
 * 
 * @param payload - Receipt data and metadata
 * @returns Emitted receipt with digest and Lamport clock
 */
export async function emitReceipt(payload: ReceiptPayload): Promise<EmittedReceipt> {
  // Get hybrid timestamp (includes Lamport increment)
  const hybridTime = await getCurrentHybridTime();

  // Get digest chain links
  const previousDigest = await getLastReceiptDigest(payload.userId);
  const baselineDigest = await getBaselineDigest();

  // Compute canonical digest
  const digest = computeReceiptDigest(
    payload.type,
    hybridTime.lamport,
    payload.data,
    previousDigest
  );

  // Generate clock attestation
  const clockAttestation = generateClockAttestation(hybridTime, digest);
  const hybridTimestampEncoded = encodeHybridTimestamp(hybridTime);

  // Generate witness signature if model provided
  let witnessSignature: string | null = null;
  if (payload.witnessModel) {
    witnessSignature = generateWitnessSignature(
      payload.witnessModel,
      digest,
      hybridTime.lamport
    );
  }

  // Create receipt in database
  const receipt = await prisma.bENReceipt.create({
    data: {
      receiptType: payload.type,
      lamportClock: hybridTime.lamport,
      realTimestamp: hybridTime.wallClock,
      userId: payload.userId,
      persona: payload.persona,
      track: payload.track,
      payload: payload.data,
      digest,
      previousDigest,
      baselineDigest,
      witnessModel: payload.witnessModel,
      witnessSignature,
      metadata: {
        hybridTimestamp: hybridTimestampEncoded,
        clockAttestation: clockAttestation.attestation,
        clockDrift: hybridTime.drift,
        node: hybridTime.node,
      },
    },
  });

  // Update Lamport counter with receipt ID
  await prisma.lamportCounter.update({
    where: { id: 1 },
    data: { lastReceiptId: receipt.id },
  });

  return {
    id: receipt.id,
    receiptType: receipt.receiptType,
    lamportClock: receipt.lamportClock,
    realTimestamp: receipt.realTimestamp,
    digest: receipt.digest,
    previousDigest: receipt.previousDigest,
    witnessSignature: receipt.witnessSignature,
  };
}

/**
 * Emit BOOT_CONFIRM receipt (system initialization)
 */
export async function emitBootConfirm(
  userId: number,
  bootData: Record<string, any>
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'BOOT_CONFIRM',
    persona: 'ARCHITECT',
    track: 'BEN_CORE',
    data: {
      event: 'BOOT',
      ...bootData,
    },
    userId,
    witnessModel: '${FP_GPT5}', // GPT-5 witness for boot
  });
}

/**
 * Emit ANALYSIS receipt (BEN Core computations)
 */
export async function emitAnalysis(
  userId: number,
  analysisData: {
    sigmaWindow?: number;
    tauThreshold?: number;
    piPolicy?: number;
    criesScore?: number;
    [key: string]: any;
  }
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'ANALYSIS',
    persona: 'ANALYST',
    track: 'BEN_CORE',
    data: analysisData,
    userId,
    witnessModel: '${MODEL_NAME}',
  });
}

/**
 * Emit DIRECTIVE receipt (governance commands)
 */
export async function emitDirective(
  userId: number,
  directive: {
    command: string;
    target: string;
    params: Record<string, any>;
  }
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'DIRECTIVE',
    persona: 'GOVERNOR',
    track: 'AUDITAAI',
    data: directive,
    userId,
  });
}

/**
 * Emit RESULT receipt (execution outcomes)
 */
export async function emitResult(
  userId: number,
  result: {
    directiveId: number;
    status: 'success' | 'failure' | 'partial';
    output: any;
    error?: string;
  }
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'RESULT',
    persona: 'USER',
    track: 'HUMAN',
    data: result,
    userId,
  });
}

/**
 * Emit APPEND receipt (state mutations)
 */
export async function emitAppend(
  userId: number,
  mutation: {
    operation: string;
    entity: string;
    changes: Record<string, any>;
  }
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'APPEND',
    persona: 'VERIFIER',
    track: 'AUDITAAI',
    data: mutation,
    userId,
  });
}

/**
 * Emit SYNC_POINT receipt (coordination markers)
 */
export async function emitSyncPoint(
  userId: number,
  syncData: {
    reason: string;
    checkpointData: Record<string, any>;
  }
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'SYNC_POINT',
    persona: 'ARCHITECT',
    track: 'BEN_CORE',
    data: syncData,
    userId,
  });
}

/**
 * Emit VERIFICATION receipt (Z-Scan results)
 */
export async function emitVerification(
  userId: number | undefined,
  verificationData: {
    scanId: number;
    totalRules: number;
    passed: number;
    warnings: number;
    critical: number;
    timestamp: string;
  }
): Promise<EmittedReceipt> {
  return emitReceipt({
    type: 'ANALYSIS',
    persona: 'ARCHITECT',
    track: 'BEN_CORE',
    data: verificationData,
    userId,
  });
}

/**
 * Verify receipt digest chain integrity
 */
export async function verifyReceiptChain(
  receiptId: number
): Promise<{
  valid: boolean;
  violations: string[];
}> {
  const receipt = await prisma.bENReceipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) {
    return {
      valid: false,
      violations: ['Receipt not found'],
    };
  }

  const violations: string[] = [];

  // Verify digest computation
  const computedDigest = computeReceiptDigest(
    receipt.receiptType,
    receipt.lamportClock,
    receipt.payload as Record<string, any>,
    receipt.previousDigest
  );

  if (computedDigest !== receipt.digest) {
    violations.push(
      `Digest mismatch: expected ${computedDigest}, got ${receipt.digest}`
    );
  }

  // Verify previous digest chain
  if (receipt.previousDigest) {
    const previousReceipt = await prisma.bENReceipt.findFirst({
      where: { digest: receipt.previousDigest },
    });

    if (!previousReceipt) {
      violations.push(`Previous receipt not found: ${receipt.previousDigest}`);
    } else if (previousReceipt.lamportClock >= receipt.lamportClock) {
      violations.push(
        `Lamport non-monotonic: previous=${previousReceipt.lamportClock}, current=${receipt.lamportClock}`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Get receipt history for user or system
 */
export async function getReceiptHistory(
  userId?: number,
  limit: number = 100
): Promise<EmittedReceipt[]> {
  const receipts = await prisma.bENReceipt.findMany({
    where: userId ? { userId } : {},
    orderBy: { lamportClock: 'desc' },
    take: limit,
    select: {
      id: true,
      receiptType: true,
      lamportClock: true,
      realTimestamp: true,
      digest: true,
      previousDigest: true,
      witnessSignature: true,
    },
  });

  return receipts;
}
