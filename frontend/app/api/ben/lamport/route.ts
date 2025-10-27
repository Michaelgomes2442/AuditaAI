import { NextRequest, NextResponse } from 'next/server';
import { getCurrentLamportValue, incrementLamportCounter, getLamportState, verifyLamportMonotonicity } from '@/lib/lamport-counter';

/**
 * GET /api/ben/lamport
 * Get current Lamport counter state
 */
export async function GET() {
  try {
    const state = await getLamportState();

    return NextResponse.json({
      currentValue: state.currentValue,
      lastUpdated: state.lastUpdated,
      lastReceiptId: state.lastReceiptId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get Lamport state', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ben/lamport
 * Increment Lamport counter
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiptId } = body;

    const increment = await incrementLamportCounter(receiptId);

    return NextResponse.json({
      success: true,
      previousValue: increment.previousValue,
      newValue: increment.newValue,
      timestamp: increment.timestamp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to increment Lamport counter', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ben/lamport/verify
 * Verify Lamport monotonicity
 */
export async function PUT() {
  try {
    const verification = await verifyLamportMonotonicity();

    return NextResponse.json({
      monotonic: verification.monotonic,
      currentValue: verification.currentValue,
      violations: verification.violations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify monotonicity', details: error.message },
      { status: 500 }
    );
  }
}
