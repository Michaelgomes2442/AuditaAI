import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/cost-analysis/budget
 * Set or update budget limit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { limit } = body;

    if (!limit || limit <= 0) {
      return NextResponse.json({ error: 'Invalid budget limit' }, { status: 400 });
    }

    // Create or update budget
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        limit,
        period: 'monthly',
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error setting budget:', error);
    return NextResponse.json(
      { error: 'Failed to set budget' },
      { status: 500 }
    );
  }
}
