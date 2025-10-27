/**
 * Hybrid Clock API
 * 
 * GET /api/ben/clock - Get current hybrid clock state
 * POST /api/ben/clock/sync - Synchronize with remote clock
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentHybridTime,
  getHybridClockStats,
  formatHybridTimestamp,
} from '@/lib/hybrid-clock';

/**
 * GET /api/ben/clock
 * Returns current hybrid clock state with statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userIdNum = userId ? parseInt(userId) : undefined;

    // Get current hybrid time
    const currentTime = await getCurrentHybridTime();

    // Get clock statistics
    const stats = await getHybridClockStats(userIdNum);

    return NextResponse.json({
      success: true,
      data: {
        currentTime,
        formatted: formatHybridTimestamp(currentTime),
        stats,
      },
    });
  } catch (error: any) {
    console.error('Failed to get hybrid clock:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get hybrid clock',
      },
      { status: 500 }
    );
  }
}
