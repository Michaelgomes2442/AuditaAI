import { NextRequest, NextResponse } from 'next/server';
import { getReceiptHistory, verifyReceiptChain } from '@/lib/receipt-emitter';

/**
 * GET /api/ben/receipt
 * Get receipt history
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const receipts = await getReceiptHistory(
      userId ? parseInt(userId) : undefined,
      limit
    );

    return NextResponse.json({
      receipts,
      count: receipts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get receipts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ben/receipt/verify
 * Verify receipt chain integrity
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiptId } = body;

    const verification = await verifyReceiptChain(receiptId);

    return NextResponse.json({
      valid: verification.valid,
      violations: verification.violations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify receipt', details: error.message },
      { status: 500 }
    );
  }
}
