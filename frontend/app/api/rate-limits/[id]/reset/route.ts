import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismadb';

// POST /api/rate-limits/[id]/reset - Reset usage counter
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
    const rateLimitId = parseInt(id);
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

    const resetAt = getNextResetTime(existing.limitPeriod);

    const rateLimit = await prisma.apiRateLimit.update({
      where: { id: rateLimitId },
      data: {
        currentUsage: 0,
        resetAt,
        lastWarningAt: null,
      },
    });

    return NextResponse.json({ rateLimit });
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to reset rate limit' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next reset time
function getNextResetTime(period: string): Date {
  const now = new Date();
  
  switch (period) {
    case 'minute':
      return new Date(now.getTime() + 60 * 1000);
    case 'hour':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'month':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour
  }
}
