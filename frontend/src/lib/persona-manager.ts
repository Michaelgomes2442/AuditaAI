/**
 * Persona Manager Service
 * 
 * Manages BEN persona system with priority-based locking and switching.
 * 
 * Persona Hierarchy (by priority):
 * - ARCHITECT (99): System architecture, self-reference, locked at boot
 * - GOVERNOR (90): Policy enforcement, directives
 * - ANALYST (80): Computations, CRIES, σ/τ analysis
 * - VERIFIER (70): Verification, Z-Scan, receipts
 * - USER (0): Default human persona
 * 
 * Rules:
 * - Higher priority personas can always switch to lower priority
 * - Lower priority personas CANNOT switch to higher without unlock
 * - ARCHITECT persona is locked at system boot
 * - Persona switches emit Δ-APPEND receipts
 */

import { PrismaClient, BENPersona } from '@/generated/prisma';
import { emitAppend } from './receipt-emitter';
import { incrementLamportCounter } from './lamport-counter';

const prisma = new PrismaClient();

// Persona priority mapping
export const PERSONA_PRIORITY: Record<BENPersona, number> = {
  ARCHITECT: 99,
  GOVERNOR: 90,
  ANALYST: 80,
  VERIFIER: 70,
  USER: 0,
};

export interface PersonaSession {
  id: number;
  persona: BENPersona;
  priority: number;
  locked: boolean;
  startedAt: Date;
  startLamport: number;
}

export interface PersonaSwitchResult {
  success: boolean;
  previousPersona: BENPersona;
  newPersona: BENPersona;
  sessionId: number;
  receiptId: number;
  message: string;
}

/**
 * Get current active persona for user
 */
export async function getCurrentPersona(userId: number): Promise<PersonaSession | null> {
  const activeSession = await prisma.bENSession.findFirst({
    where: {
      userId,
      endedAt: null, // Active session
    },
    orderBy: { startedAt: 'desc' },
  });

  if (!activeSession) {
    return null;
  }

  return {
    id: activeSession.id,
    persona: activeSession.persona,
    priority: activeSession.priority,
    locked: activeSession.locked,
    startedAt: activeSession.startedAt,
    startLamport: activeSession.startLamport,
  };
}

/**
 * Initialize default USER persona for new user
 */
export async function initializeUserPersona(userId: number): Promise<PersonaSession> {
  const lamportIncrement = await incrementLamportCounter();

  const session = await prisma.bENSession.create({
    data: {
      userId,
      persona: 'USER',
      priority: PERSONA_PRIORITY.USER,
      locked: false,
      startLamport: lamportIncrement.newValue,
    },
  });

  // Update user's current persona
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPersona: 'USER',
      personaLocked: false,
    },
  });

  return {
    id: session.id,
    persona: session.persona,
    priority: session.priority,
    locked: session.locked,
    startedAt: session.startedAt,
    startLamport: session.startLamport,
  };
}

/**
 * Verify if persona switch is allowed
 */
function canSwitchPersona(
  currentPersona: BENPersona,
  targetPersona: BENPersona,
  locked: boolean
): { allowed: boolean; reason: string } {
  // Cannot switch if locked
  if (locked) {
    return {
      allowed: false,
      reason: `Persona ${currentPersona} is locked`,
    };
  }

  const currentPriority = PERSONA_PRIORITY[currentPersona];
  const targetPriority = PERSONA_PRIORITY[targetPersona];

  // Higher priority can always switch to lower
  if (currentPriority >= targetPriority) {
    return { allowed: true, reason: 'Priority allows switch' };
  }

  // Lower priority cannot switch to higher
  return {
    allowed: false,
    reason: `Cannot switch from ${currentPersona} (${currentPriority}) to ${targetPersona} (${targetPriority}) - insufficient priority`,
  };
}

/**
 * Switch persona for user
 */
export async function switchPersona(
  userId: number,
  targetPersona: BENPersona,
  reason?: string
): Promise<PersonaSwitchResult> {
  // Get current persona
  const currentSession = await getCurrentPersona(userId);

  if (!currentSession) {
    // Initialize if no session exists
    await initializeUserPersona(userId);
    return switchPersona(userId, targetPersona, reason);
  }

  // Verify switch is allowed
  const permission = canSwitchPersona(
    currentSession.persona,
    targetPersona,
    currentSession.locked
  );

  if (!permission.allowed) {
    return {
      success: false,
      previousPersona: currentSession.persona,
      newPersona: currentSession.persona,
      sessionId: currentSession.id,
      receiptId: 0,
      message: permission.reason,
    };
  }

  // End current session
  const endLamport = await incrementLamportCounter();
  const endedAt = new Date();
  const duration = Math.floor(
    (endedAt.getTime() - currentSession.startedAt.getTime()) / 1000
  );

  await prisma.bENSession.update({
    where: { id: currentSession.id },
    data: {
      endedAt,
      endLamport: endLamport.newValue,
      duration,
    },
  });

  // Create new session
  const startLamport = await incrementLamportCounter();

  const newSession = await prisma.bENSession.create({
    data: {
      userId,
      persona: targetPersona,
      priority: PERSONA_PRIORITY[targetPersona],
      locked: targetPersona === 'ARCHITECT', // ARCHITECT is always locked
      startLamport: startLamport.newValue,
      switchReason: reason || `Switched from ${currentSession.persona}`,
    },
  });

  // Update user's current persona
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPersona: targetPersona,
      personaLocked: targetPersona === 'ARCHITECT',
    },
  });

  // Emit Δ-APPEND receipt for persona switch
  const receipt = await emitAppend(userId, {
    operation: 'PERSONA_SWITCH',
    entity: 'BENSession',
    changes: {
      from: currentSession.persona,
      to: targetPersona,
      fromPriority: currentSession.priority,
      toPriority: PERSONA_PRIORITY[targetPersona],
      sessionId: newSession.id,
      reason: reason || 'User-initiated switch',
    },
  });

  return {
    success: true,
    previousPersona: currentSession.persona,
    newPersona: targetPersona,
    sessionId: newSession.id,
    receiptId: receipt.id,
    message: `Successfully switched from ${currentSession.persona} to ${targetPersona}`,
  };
}

/**
 * Lock current persona (prevents switching)
 */
export async function lockPersona(userId: number): Promise<{ success: boolean; message: string }> {
  const currentSession = await getCurrentPersona(userId);

  if (!currentSession) {
    return {
      success: false,
      message: 'No active persona session',
    };
  }

  if (currentSession.locked) {
    return {
      success: false,
      message: `Persona ${currentSession.persona} is already locked`,
    };
  }

  await prisma.bENSession.update({
    where: { id: currentSession.id },
    data: { locked: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { personaLocked: true },
  });

  // Emit receipt
  await emitAppend(userId, {
    operation: 'PERSONA_LOCK',
    entity: 'BENSession',
    changes: {
      sessionId: currentSession.id,
      persona: currentSession.persona,
      locked: true,
    },
  });

  return {
    success: true,
    message: `Persona ${currentSession.persona} locked`,
  };
}

/**
 * Unlock persona (allows switching)
 * Only ARCHITECT can unlock personas
 */
export async function unlockPersona(
  userId: number,
  requestingPersona: BENPersona
): Promise<{ success: boolean; message: string }> {
  // Only ARCHITECT can unlock
  if (requestingPersona !== 'ARCHITECT') {
    return {
      success: false,
      message: 'Only ARCHITECT persona can unlock personas',
    };
  }

  const currentSession = await getCurrentPersona(userId);

  if (!currentSession) {
    return {
      success: false,
      message: 'No active persona session',
    };
  }

  if (!currentSession.locked) {
    return {
      success: false,
      message: `Persona ${currentSession.persona} is not locked`,
    };
  }

  await prisma.bENSession.update({
    where: { id: currentSession.id },
    data: { locked: false },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { personaLocked: false },
  });

  // Emit receipt
  await emitAppend(userId, {
    operation: 'PERSONA_UNLOCK',
    entity: 'BENSession',
    changes: {
      sessionId: currentSession.id,
      persona: currentSession.persona,
      locked: false,
      unlockedBy: 'ARCHITECT',
    },
  });

  return {
    success: true,
    message: `Persona ${currentSession.persona} unlocked`,
  };
}

/**
 * Get persona session history for user
 */
export async function getPersonaHistory(
  userId: number,
  limit: number = 50
): Promise<PersonaSession[]> {
  const sessions = await prisma.bENSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });

  return sessions.map((s) => ({
    id: s.id,
    persona: s.persona,
    priority: s.priority,
    locked: s.locked,
    startedAt: s.startedAt,
    startLamport: s.startLamport,
  }));
}

/**
 * Get persona statistics
 */
export async function getPersonaStats(userId: number): Promise<{
  currentPersona: BENPersona;
  totalSwitches: number;
  sessionsByPersona: Record<BENPersona, number>;
  totalDuration: number;
}> {
  const sessions = await prisma.bENSession.findMany({
    where: { userId },
  });

  const current = await getCurrentPersona(userId);

  const sessionsByPersona: Record<string, number> = {};
  let totalDuration = 0;

  for (const session of sessions) {
    sessionsByPersona[session.persona] = (sessionsByPersona[session.persona] || 0) + 1;
    if (session.duration) {
      totalDuration += session.duration;
    }
  }

  return {
    currentPersona: current?.persona || 'USER',
    totalSwitches: sessions.length - 1, // First session is not a switch
    sessionsByPersona: sessionsByPersona as Record<BENPersona, number>,
    totalDuration,
  };
}
