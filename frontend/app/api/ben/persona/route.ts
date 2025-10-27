import { NextRequest, NextResponse } from 'next/server';
import { switchPersona, getCurrentPersona, lockPersona, unlockPersona, getPersonaStats } from '@/lib/persona-manager';

/**
 * GET /api/ben/persona
 * Get current persona session
 */
export async function GET(req: NextRequest) {
  try {
    const userId = 1; // Mock user ID - in production, get from session

    const currentSession = await getCurrentPersona(userId);

    if (!currentSession) {
      return NextResponse.json({
        persona: 'USER',
        locked: false,
        message: 'No active persona session',
      });
    }

    return NextResponse.json({
      persona: currentSession.persona,
      priority: currentSession.priority,
      locked: currentSession.locked,
      startedAt: currentSession.startedAt,
      startLamport: currentSession.startLamport,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get persona', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ben/persona
 * Switch to new persona
 */
export async function POST(req: NextRequest) {
  try {
    const userId = 1; // Mock user ID
    const body = await req.json();
    const { targetPersona, reason } = body;

    const result = await switchPersona(userId, targetPersona, reason);

    return NextResponse.json({
      success: result.success,
      previousPersona: result.previousPersona,
      newPersona: result.newPersona,
      sessionId: result.sessionId,
      receiptId: result.receiptId,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to switch persona', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ben/persona/lock
 * Lock current persona
 */
export async function PUT(req: NextRequest) {
  try {
    const userId = 1; // Mock user ID
    const body = await req.json();
    const { lock } = body;

    const result = lock
      ? await lockPersona(userId)
      : await unlockPersona(userId, 'ARCHITECT');

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to lock/unlock persona', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ben/persona/stats
 * Get persona statistics
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = 1; // Mock user ID

    const stats = await getPersonaStats(userId);

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get persona stats', details: error.message },
      { status: 500 }
    );
  }
}
