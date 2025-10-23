import { NextRequest, NextResponse } from 'next/server';
import { runZScan, getZScanHistory, getZScanStats, DEFAULT_ZSCAN_CONFIG } from '@/lib/zscan-engine';

/**
 * POST /api/zscan/run
 * Run Z-Scan verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, config } = body;

    const result = await runZScan(userId, config);

    return NextResponse.json({
      success: true,
      scan: result,
    });
  } catch (error: any) {
    console.error('Z-Scan failed:', error);
    return NextResponse.json(
      { error: 'Z-Scan failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zscan/run?userId=1&limit=50&stats=true
 * Get Z-Scan history or statistics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const scanStats = await getZScanStats(userId ? parseInt(userId) : undefined);
      return NextResponse.json(scanStats);
    }

    const history = await getZScanHistory(
      userId ? parseInt(userId) : undefined,
      limit
    );

    return NextResponse.json({
      history,
      count: history.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get Z-Scan history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zscan/config
 * Get default Z-Scan configuration
 */
export async function PATCH(req: NextRequest) {
  return NextResponse.json({
    config: DEFAULT_ZSCAN_CONFIG,
  });
}
