import { NextRequest, NextResponse } from 'next/server';
import { emitBootConfirm } from '@/lib/receipt-emitter';
import { initializeUserPersona } from '@/lib/persona-manager';
import { initializeLamportCounter } from '@/lib/lamport-counter';

/**
 * POST /api/ben/boot
 * 
 * Initialize BEN Runtime with Δ-BOOTCONFIRM receipt
 * This is the first operation when starting a cognitive session
 */
export async function POST(req: NextRequest) {
  try {
    // In production, get userId from session
    const userId = 1; // Mock user ID
    const body = await req.json();

    // Initialize Lamport counter
    const lamportState = await initializeLamportCounter();

    // Initialize user persona (default: USER)
    const personaSession = await initializeUserPersona(userId);

    // Emit Δ-BOOTCONFIRM receipt
    const bootReceipt = await emitBootConfirm(userId, {
      bootTime: new Date().toISOString(),
      initialPersona: personaSession.persona,
      lamportBaseline: lamportState.currentValue,
      systemVersion: '1.0.0',
      band: 'Band-0',
      mode: 'deterministic',
      ...body.metadata,
    });

    return NextResponse.json({
      success: true,
      boot: {
        receiptId: bootReceipt.id,
        lamportClock: bootReceipt.lamportClock,
        digest: bootReceipt.digest,
        persona: personaSession.persona,
        sessionId: personaSession.id,
      },
      message: 'BEN Runtime initialized successfully',
    });
  } catch (error: any) {
    console.error('BEN boot failed:', error);
    return NextResponse.json(
      { error: 'Boot initialization failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ben/boot
 * 
 * Get boot status and last boot receipt
 */
export async function GET(req: NextRequest) {
  try {
    // In production, get userId from session and fetch from database
    // For now, return mock data
    return NextResponse.json({
      booted: true,
      lastBoot: new Date().toISOString(),
      lamportClock: 1234,
      persona: 'USER',
    });
  } catch (error: any) {
    console.error('Failed to get boot status:', error);
    return NextResponse.json(
      { error: 'Failed to get boot status', details: error.message },
      { status: 500 }
    );
  }
}
