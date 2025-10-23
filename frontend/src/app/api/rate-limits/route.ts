import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/rate-limits - Fetch all rate limits for the current user
export async function GET(req: NextRequest) {
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

    const rateLimits = await prisma.apiRateLimit.findMany({
      where: { userId: user.id },
      orderBy: [
        { provider: 'asc' },
        { limitType: 'asc' },
        { limitPeriod: 'asc' },
      ],
    });

    // Check for expired limits and reset them
    const now = new Date();
    const updates = rateLimits
      .filter(rl => new Date(rl.resetAt) <= now)
      .map(rl => {
        const resetAt = getNextResetTime(rl.limitPeriod);
        return prisma.apiRateLimit.update({
          where: { id: rl.id },
          data: {
            currentUsage: 0,
            resetAt,
            lastWarningAt: null,
          },
        });
      });

    if (updates.length > 0) {
      await Promise.all(updates);
      // Refetch after reset
      const updatedRateLimits = await prisma.apiRateLimit.findMany({
        where: { userId: user.id },
        orderBy: [
          { provider: 'asc' },
          { limitType: 'asc' },
          { limitPeriod: 'asc' },
        ],
      });
      return NextResponse.json({ rateLimits: updatedRateLimits });
    }

    return NextResponse.json({ rateLimits });
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limits' },
      { status: 500 }
    );
  }
}

// POST /api/rate-limits - Create a new rate limit
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { provider, limitType, limitPeriod, maxLimit, warningThreshold } = body;

    if (!provider || !limitType || !limitPeriod || !maxLimit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if limit already exists
    const existing = await prisma.apiRateLimit.findUnique({
      where: {
        userId_provider_limitType_limitPeriod: {
          userId: user.id,
          provider,
          limitType,
          limitPeriod,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Rate limit already exists for this combination' },
        { status: 409 }
      );
    }

    const resetAt = getNextResetTime(limitPeriod);

    const rateLimit = await prisma.apiRateLimit.create({
      data: {
        userId: user.id,
        provider,
        limitType,
        limitPeriod,
        maxLimit,
        currentUsage: 0,
        resetAt,
        warningThreshold: warningThreshold || 80,
      },
    });

    return NextResponse.json({ rateLimit }, { status: 201 });
  } catch (error) {
    console.error('Error creating rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to create rate limit' },
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
