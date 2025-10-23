import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/rate-limits/[id] - Update a rate limit
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rateLimitId = parseInt(params.id);
    if (isNaN(rateLimitId)) {
      return NextResponse.json({ error: 'Invalid rate limit ID' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.apiRateLimit.findFirst({
      where: {
        id: rateLimitId,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rate limit not found' }, { status: 404 });
    }

    const body = await req.json();
    const { maxLimit, warningThreshold } = body;

    const rateLimit = await prisma.apiRateLimit.update({
      where: { id: rateLimitId },
      data: {
        ...(maxLimit !== undefined && { maxLimit }),
        ...(warningThreshold !== undefined && { warningThreshold }),
      },
    });

    return NextResponse.json({ rateLimit });
  } catch (error) {
    console.error('Error updating rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to update rate limit' },
      { status: 500 }
    );
  }
}

// DELETE /api/rate-limits/[id] - Delete a rate limit
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rateLimitId = parseInt(params.id);
    if (isNaN(rateLimitId)) {
      return NextResponse.json({ error: 'Invalid rate limit ID' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.apiRateLimit.findFirst({
      where: {
        id: rateLimitId,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Rate limit not found' }, { status: 404 });
    }

    await prisma.apiRateLimit.delete({
      where: { id: rateLimitId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to delete rate limit' },
      { status: 500 }
    );
  }
}
