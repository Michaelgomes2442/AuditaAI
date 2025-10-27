import { NextRequest, NextResponse } from 'next/server';
import { computeCRIESScore, computeAndStoreCRIES, getCRIESHistory, getCRIESStats } from '@/lib/cries-engine';

/**
 * POST /api/cries/compute
 * Compute CRIES score for prompt/response pair
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, response, citations, userId, testResultId, store = false } = body;

    if (!prompt || !response) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and response' },
        { status: 400 }
      );
    }

    if (store) {
      // Compute and store with receipt
      const computation = await computeAndStoreCRIES({
        prompt,
        response,
        citations,
        userId,
        testResultId,
      });

      return NextResponse.json({
        success: true,
        computation: {
          id: computation.id,
          criesScore: computation.criesScore,
          lamportClock: computation.lamportClock,
          receiptId: computation.receiptId,
          computedAt: computation.computedAt,
        },
      });
    } else {
      // Compute without storing
      const score = computeCRIESScore({ prompt, response, citations });

      return NextResponse.json({
        success: true,
        score,
      });
    }
  } catch (error: any) {
    console.error('CRIES computation failed:', error);
    return NextResponse.json(
      { error: 'CRIES computation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cries/compute?userId=1&limit=50
 * Get CRIES computation history
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const criesStats = await getCRIESStats(userId ? parseInt(userId) : undefined);
      return NextResponse.json(criesStats);
    }

    const history = await getCRIESHistory(
      userId ? parseInt(userId) : undefined,
      limit
    );

    return NextResponse.json({
      history,
      count: history.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get CRIES history', details: error.message },
      { status: 500 }
    );
  }
}
