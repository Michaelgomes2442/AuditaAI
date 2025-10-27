import { NextRequest, NextResponse } from 'next/server';
import { requestWitnessSignature, verifyWitnessSignature, getWitnessesForReceipt, requestMultiModelConsensus, getWitnessStats } from '@/lib/witness-signer';

/**
 * POST /api/ben/witness
 * Request witness signature
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiptDigest, modelName, data } = body;

    const witness = await requestWitnessSignature({
      receiptDigest,
      modelName,
      data,
    });

    return NextResponse.json({
      success: true,
      witness: {
        id: witness.id,
        modelName: witness.modelName,
        signature: witness.signature,
        lamportClock: witness.lamportClock,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to request witness', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ben/witness
 * Verify witness signature
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { witnessId } = body;

    const verification = await verifyWitnessSignature(witnessId);

    return NextResponse.json({
      valid: verification.valid,
      message: verification.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify witness', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ben/witness?receiptDigest=abc123
 * Get witnesses for receipt
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const receiptDigest = searchParams.get('receiptDigest');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const witnessStats = await getWitnessStats();
      return NextResponse.json(witnessStats);
    }

    if (!receiptDigest) {
      return NextResponse.json(
        { error: 'Missing receiptDigest parameter' },
        { status: 400 }
      );
    }

    const witnesses = await getWitnessesForReceipt(receiptDigest);

    return NextResponse.json({
      witnesses,
      count: witnesses.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get witnesses', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ben/witness/consensus
 * Request multi-model consensus
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiptDigest, models } = body;

    const consensus = await requestMultiModelConsensus(receiptDigest, models);

    return NextResponse.json({
      success: true,
      consensus: {
        receiptDigest: consensus.receiptDigest,
        witnesses: consensus.witnesses,
        consensusReached: consensus.consensusReached,
        agreementRate: consensus.agreementRate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to request consensus', details: error.message },
      { status: 500 }
    );
  }
}
