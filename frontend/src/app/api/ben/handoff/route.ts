import { NextRequest, NextResponse } from 'next/server';
import { initiateHandoff, completeHandoff, getHandoffStatus, getHandoffsByTraceId, getHandoffStats } from '@/lib/tri-track-handoff';

/**
 * POST /api/ben/handoff
 * Initiate tri-track handoff
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromTrack, toTrack, data, traceId } = body;
    const userId = 1; // Mock user ID

    const handoff = await initiateHandoff({
      fromTrack,
      toTrack,
      data,
      traceId,
      userId,
    });

    return NextResponse.json({
      success: true,
      handoff: {
        id: handoff.id,
        status: handoff.status,
        fromReceiptId: handoff.fromReceiptId,
        traceId: handoff.traceId,
        latencyMs: handoff.latencyMs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to initiate handoff', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ben/handoff
 * Complete handoff with result
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { handoffId, result } = body;

    const completed = await completeHandoff(handoffId, result);

    return NextResponse.json({
      success: true,
      handoff: {
        id: completed.id,
        status: completed.status,
        latencyMs: completed.latencyMs,
        exceededLimit: completed.exceededLimit,
        traceId: completed.traceId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to complete handoff', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ben/handoff?handoffId=123
 * Get handoff status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const handoffId = searchParams.get('handoffId');
    const traceId = searchParams.get('traceId');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const handoffStats = await getHandoffStats();
      return NextResponse.json(handoffStats);
    }

    if (handoffId) {
      const status = await getHandoffStatus(parseInt(handoffId));
      return NextResponse.json({ handoff: status });
    }

    if (traceId) {
      const handoffs = await getHandoffsByTraceId(traceId);
      return NextResponse.json({ handoffs, count: handoffs.length });
    }

    return NextResponse.json(
      { error: 'Missing handoffId or traceId parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get handoff status', details: error.message },
      { status: 500 }
    );
  }
}
