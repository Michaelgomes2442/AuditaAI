import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismadb';

// GET /api/rate-limits/warnings - Get active rate limit warnings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ warnings: [] });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ warnings: [] });
    }

    const rateLimits = await prisma.apiRateLimit.findMany({
      where: { userId: user.id },
    });

    // Filter for limits that are at or above warning threshold
    const warnings = rateLimits
      .filter(rl => {
        const percentage = (rl.currentUsage / rl.maxLimit) * 100;
        return percentage >= rl.warningThreshold;
      })
      .map(rl => ({
        provider: rl.provider,
        limitType: rl.limitType,
        percentage: (rl.currentUsage / rl.maxLimit) * 100,
        current: rl.currentUsage,
        max: rl.maxLimit,
        resetAt: rl.resetAt.toISOString(),
      }));

    return NextResponse.json({ warnings });
  } catch (error) {
    console.error('Error fetching rate limit warnings:', error);
    return NextResponse.json({ warnings: [] });
  }
}
