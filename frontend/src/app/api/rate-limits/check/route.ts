import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit } from '@/lib/rate-limiting';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/rate-limits/check
 * Check if a user can make an API request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with tier
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        tier: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { provider, endpoint = 'chat' } = body;

    if (!provider) {
      return NextResponse.json(
        { error: 'provider is required' },
        { status: 400 }
      );
    }

    const result = await checkRateLimit(user.id, user.tier, provider, endpoint);

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          error: 'Rate limit exceeded',
          limit: result.limit,
          used: result.used,
          remaining: 0,
          resetAt: result.resetAt.toISOString(),
          retryAfter: result.retryAfter
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': result.retryAfter?.toString() || '0'
          }
        }
      );
    }

    return NextResponse.json({
      allowed: true,
      limit: result.limit,
      used: result.used,
      remaining: result.remaining,
      resetAt: result.resetAt.toISOString()
    }, {
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    );
  }
}
