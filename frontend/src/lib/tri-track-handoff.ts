/**
 * Tri-Track Handoff Service
 * 
 * Orchestrates deterministic handoffs between three cognitive tracks:
 * - Track-A (BEN_CORE): Analyst role, enforces Π/τ, computes σ windows & CRIES
 * - Track-B (AUDITAAI): Governor/Verifier, applies policies, Z-Scan, consent/trace_id
 * - Track-C (HUMAN): Executor, receives directives, returns results
 * 
 * Handoff Flow:
 * A→B (Δ-ANALYSIS): BEN Core sends analysis to AuditaAI for governance
 * B→C (Δ-DIRECTIVE): AuditaAI sends directive to Human for execution
 * C→B (Δ-RESULT): Human returns result to AuditaAI for verification
 * 
 * Constraints:
 * - Each handoff must complete in ≤60 seconds
 * - All handoffs emit receipts with Lamport linking
 * - Trace ID propagates across all tracks
 */

import { PrismaClient, TrackType, HandoffStatus } from '@/generated/prisma';
import { emitAnalysis, emitDirective, emitResult } from './receipt-emitter';
import { incrementLamportCounter } from './lamport-counter';

const prisma = new PrismaClient();

const HANDOFF_TIMEOUT_MS = 60000; // 60 seconds max

export interface HandoffPayload {
  fromTrack: TrackType;
  toTrack: TrackType;
  data: Record<string, any>;
  traceId?: string;
  userId: number;
}

export interface HandoffResult {
  id: number;
  status: HandoffStatus;
  fromReceiptId: number;
  toReceiptId: number | null;
  latencyMs: number;
  exceededLimit: boolean;
  traceId: string;
}

/**
 * Generate unique trace ID for handoff
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initiate handoff between tracks
 * Creates handoff record and emits appropriate receipt
 */
export async function initiateHandoff(payload: HandoffPayload): Promise<HandoffResult> {
  const traceId = payload.traceId || generateTraceId();
  const startTime = Date.now();

  // Validate handoff direction
  const validHandoffs = [
    { from: 'BEN_CORE', to: 'AUDITAAI' },  // A→B
    { from: 'AUDITAAI', to: 'HUMAN' },     // B→C
    { from: 'HUMAN', to: 'AUDITAAI' },     // C→B
  ];

  const isValid = validHandoffs.some(
    (h) => h.from === payload.fromTrack && h.to === payload.toTrack
  );

  if (!isValid) {
    throw new Error(
      `Invalid handoff: ${payload.fromTrack} → ${payload.toTrack}. ` +
      `Valid handoffs: A→B, B→C, C→B`
    );
  }

  // Emit appropriate receipt based on handoff type
  let fromReceipt;

  if (payload.fromTrack === 'BEN_CORE' && payload.toTrack === 'AUDITAAI') {
    // A→B: Emit Δ-ANALYSIS
    fromReceipt = await emitAnalysis(payload.userId, {
      ...payload.data,
      handoff: 'A_TO_B',
      traceId,
    });
  } else if (payload.fromTrack === 'AUDITAAI' && payload.toTrack === 'HUMAN') {
    // B→C: Emit Δ-DIRECTIVE
    fromReceipt = await emitDirective(payload.userId, {
      command: payload.data.command || 'EXECUTE',
      target: payload.data.target || 'user',
      params: payload.data.params || {},
      traceId,
    });
  } else if (payload.fromTrack === 'HUMAN' && payload.toTrack === 'AUDITAAI') {
    // C→B: Emit Δ-RESULT
    fromReceipt = await emitResult(payload.userId, {
      directiveId: payload.data.directiveId || 0,
      status: payload.data.status || 'success',
      output: payload.data.output || {},
      error: payload.data.error,
      traceId,
    });
  } else {
    throw new Error('Invalid handoff configuration');
  }

  // Create handoff record
  const handoff = await prisma.triTrackHandoff.create({
    data: {
      fromTrack: payload.fromTrack,
      toTrack: payload.toTrack,
      status: 'INITIATED',
      fromReceiptId: fromReceipt.id,
      payload: {
        ...payload.data,
        traceId,
        initiatedAt: new Date().toISOString(),
      },
    },
  });

  return {
    id: handoff.id,
    status: 'INITIATED',
    fromReceiptId: fromReceipt.id,
    toReceiptId: null,
    latencyMs: Date.now() - startTime,
    exceededLimit: false,
    traceId,
  };
}

/**
 * Complete handoff with result receipt
 * Links the result receipt to the handoff
 */
export async function completeHandoff(
  handoffId: number,
  result: Record<string, any>
): Promise<HandoffResult> {
  const handoff = await prisma.triTrackHandoff.findUnique({
    where: { id: handoffId },
  });

  if (!handoff) {
    throw new Error(`Handoff ${handoffId} not found`);
  }

  if (handoff.status !== 'INITIATED' && handoff.status !== 'IN_TRANSIT') {
    throw new Error(`Handoff ${handoffId} already completed with status: ${handoff.status}`);
  }

  const startTime = handoff.initiatedAt.getTime();
  const now = Date.now();
  const latencyMs = now - startTime;
  const exceededLimit = latencyMs > HANDOFF_TIMEOUT_MS;

  // Update handoff with completion
  const updated = await prisma.triTrackHandoff.update({
    where: { id: handoffId },
    data: {
      status: exceededLimit ? 'TIMEOUT' : 'COMPLETED',
      completedAt: new Date(),
      latencyMs,
      exceededLimit,
      result,
    },
  });

  // Get trace ID from payload
  const traceId = (handoff.payload as any).traceId || 'unknown';

  return {
    id: updated.id,
    status: updated.status,
    fromReceiptId: updated.fromReceiptId,
    toReceiptId: updated.toReceiptId,
    latencyMs,
    exceededLimit,
    traceId,
  };
}

/**
 * Execute full A→B→C handoff cycle
 * This is the complete tri-track orchestration
 */
export async function executeTriTrackCycle(
  userId: number,
  analysisData: Record<string, any>,
  directiveCommand: string,
  directiveTarget: string,
  directiveParams: Record<string, any>
): Promise<{
  traceId: string;
  handoffs: HandoffResult[];
  totalLatencyMs: number;
  success: boolean;
}> {
  const cycleStart = Date.now();
  const traceId = generateTraceId();
  const handoffs: HandoffResult[] = [];

  try {
    // Step 1: A→B (BEN_CORE → AUDITAAI)
    const abHandoff = await initiateHandoff({
      fromTrack: 'BEN_CORE',
      toTrack: 'AUDITAAI',
      data: analysisData,
      traceId,
      userId,
    });
    handoffs.push(abHandoff);

    // Complete A→B handoff
    const abComplete = await completeHandoff(abHandoff.id, {
      analysisReceived: true,
      nextStep: 'DIRECTIVE',
    });
    handoffs[0] = abComplete;

    // Step 2: B→C (AUDITAAI → HUMAN)
    const bcHandoff = await initiateHandoff({
      fromTrack: 'AUDITAAI',
      toTrack: 'HUMAN',
      data: {
        command: directiveCommand,
        target: directiveTarget,
        params: directiveParams,
        fromHandoff: abComplete.id,
      },
      traceId,
      userId,
    });
    handoffs.push(bcHandoff);

    // At this point, waiting for human execution...
    // The human completion would call completeHandoff externally

    const totalLatencyMs = Date.now() - cycleStart;

    return {
      traceId,
      handoffs,
      totalLatencyMs,
      success: !handoffs.some((h) => h.exceededLimit),
    };
  } catch (error) {
    throw new Error(`Tri-track cycle failed: ${error}`);
  }
}

/**
 * Get handoff status
 */
export async function getHandoffStatus(handoffId: number): Promise<HandoffResult | null> {
  const handoff = await prisma.triTrackHandoff.findUnique({
    where: { id: handoffId },
  });

  if (!handoff) {
    return null;
  }

  const traceId = (handoff.payload as any).traceId || 'unknown';

  return {
    id: handoff.id,
    status: handoff.status,
    fromReceiptId: handoff.fromReceiptId,
    toReceiptId: handoff.toReceiptId,
    latencyMs: handoff.latencyMs || 0,
    exceededLimit: handoff.exceededLimit,
    traceId,
  };
}

/**
 * Get all handoffs for trace ID
 */
export async function getHandoffsByTraceId(traceId: string): Promise<HandoffResult[]> {
  const handoffs = await prisma.triTrackHandoff.findMany({
    where: {
      payload: {
        path: ['traceId'],
        equals: traceId,
      },
    },
    orderBy: { initiatedAt: 'asc' },
  });

  return handoffs.map((h) => ({
    id: h.id,
    status: h.status,
    fromReceiptId: h.fromReceiptId,
    toReceiptId: h.toReceiptId,
    latencyMs: h.latencyMs || 0,
    exceededLimit: h.exceededLimit,
    traceId,
  }));
}

/**
 * Get handoff history for user
 */
export async function getHandoffHistory(
  userId: number,
  limit: number = 50
): Promise<any[]> {
  const handoffs = await prisma.triTrackHandoff.findMany({
    orderBy: { initiatedAt: 'desc' },
    take: limit,
    include: {
      fromReceipt: {
        select: {
          userId: true,
          lamportClock: true,
          receiptType: true,
        },
      },
    },
  });

  // Filter by userId from receipts
  return handoffs
    .filter((h) => h.fromReceipt.userId === userId)
    .map((h) => ({
      id: h.id,
      fromTrack: h.fromTrack,
      toTrack: h.toTrack,
      status: h.status,
      latencyMs: h.latencyMs,
      exceededLimit: h.exceededLimit,
      initiatedAt: h.initiatedAt,
      completedAt: h.completedAt,
      traceId: (h.payload as any).traceId,
    }));
}

/**
 * Monitor handoff timeouts
 * Returns handoffs that have exceeded the 60s limit
 */
export async function monitorHandoffTimeouts(): Promise<{
  timeouts: number;
  handoffIds: number[];
}> {
  const cutoff = new Date(Date.now() - HANDOFF_TIMEOUT_MS);

  const timedOut = await prisma.triTrackHandoff.findMany({
    where: {
      status: {
        in: ['INITIATED', 'IN_TRANSIT'],
      },
      initiatedAt: {
        lt: cutoff,
      },
      exceededLimit: false, // Not yet marked as timeout
    },
  });

  // Mark as timeout
  const handoffIds = timedOut.map((h) => h.id);

  if (handoffIds.length > 0) {
    await prisma.triTrackHandoff.updateMany({
      where: {
        id: { in: handoffIds },
      },
      data: {
        status: 'TIMEOUT',
        exceededLimit: true,
        completedAt: new Date(),
      },
    });
  }

  return {
    timeouts: handoffIds.length,
    handoffIds,
  };
}

/**
 * Get handoff statistics
 */
export async function getHandoffStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  timeout: number;
  averageLatencyMs: number;
  timeoutRate: number;
}> {
  const handoffs = await prisma.triTrackHandoff.findMany();

  const total = handoffs.length;
  const completed = handoffs.filter((h) => h.status === 'COMPLETED').length;
  const failed = handoffs.filter((h) => h.status === 'FAILED').length;
  const timeout = handoffs.filter((h) => h.status === 'TIMEOUT').length;

  const completedHandoffs = handoffs.filter((h) => h.latencyMs !== null);
  const averageLatencyMs =
    completedHandoffs.length > 0
      ? completedHandoffs.reduce((sum, h) => sum + (h.latencyMs || 0), 0) /
        completedHandoffs.length
      : 0;

  const timeoutRate = total > 0 ? timeout / total : 0;

  return {
    total,
    completed,
    failed,
    timeout,
    averageLatencyMs: Math.round(averageLatencyMs),
    timeoutRate: Math.round(timeoutRate * 100) / 100,
  };
}
