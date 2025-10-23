/**
 * Clock Drift API
 * 
 * GET /api/ben/clock/drift - Get clock drift statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHybridClockStats } from '@/lib/hybrid-clock';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userIdNum = userId ? parseInt(userId) : undefined;

    // Get clock statistics
    const stats = await getHybridClockStats(userIdNum);

    // Calculate drift metrics
    const driftMetrics = {
      avgTimeBetweenEventsMs: stats.avgTimeBetweenEventsMs,
      avgTimeBetweenEventsSeconds: stats.avgTimeBetweenEventsSeconds,
      avgLamportIncrement: stats.avgLamportIncrement,
      expectedTimePerLamport: stats.avgLamportIncrement > 0
        ? stats.avgTimeBetweenEventsMs / stats.avgLamportIncrement
        : 0,
      totalReceipts: stats.totalReceipts,
      node: stats.node,
    };

    return NextResponse.json({
      success: true,
      data: {
        currentLamport: stats.currentLamport,
        currentWallClock: stats.currentWallClock,
        drift: driftMetrics,
        healthStatus:
          driftMetrics.avgTimeBetweenEventsMs < 60000
            ? 'healthy'
            : driftMetrics.avgTimeBetweenEventsMs < 300000
              ? 'warning'
              : 'critical',
      },
    });
  } catch (error: any) {
    console.error('Failed to get clock drift:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get clock drift',
      },
      { status: 500 }
    );
  }
}
