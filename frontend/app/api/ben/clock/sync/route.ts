/**
 * Clock Synchronization API
 * 
 * POST /api/ben/clock/sync - Synchronize with remote clock
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  synchronizeClocks,
  HybridTimestamp,
  formatHybridTimestamp,
} from '@/lib/hybrid-clock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { remoteClock } = body as { remoteClock: HybridTimestamp };

    if (!remoteClock || !remoteClock.lamport || !remoteClock.wallClock) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid remote clock data. Required: lamport, wallClock, node',
        },
        { status: 400 }
      );
    }

    // Convert wallClock string to Date if needed
    const remoteClockParsed: HybridTimestamp = {
      ...remoteClock,
      wallClock: new Date(remoteClock.wallClock),
    };

    // Synchronize clocks
    const result = await synchronizeClocks(remoteClockParsed);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        localClockFormatted: formatHybridTimestamp(result.localClock),
        remoteClockFormatted: result.remoteClock
          ? formatHybridTimestamp(result.remoteClock)
          : null,
      },
    });
  } catch (error: any) {
    console.error('Failed to synchronize clocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to synchronize clocks',
      },
      { status: 500 }
    );
  }
}
