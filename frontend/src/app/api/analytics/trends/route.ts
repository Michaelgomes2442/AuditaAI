import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const modelName = searchParams.get('model');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query real test results from database
    const whereClause: any = {
      userId: user.id,
      createdAt: { gte: startDate },
      status: 'completed', // Only show completed tests
    };

    if (modelName) {
      whereClause.modelName = modelName;
    }

    const results = await prisma.testResult.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        modelName: true,
        modelProvider: true,
        criesScore: true,
        responseTime: true,
        tokenCount: true,
        cost: true,
        createdAt: true,
      },
    });

    // Get unique models for filtering
    const models = await prisma.testResult.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      select: {
        modelName: true,
        modelProvider: true,
      },
      distinct: ['modelName'],
    });

    return NextResponse.json({
      results,
      models,
      startDate,
      endDate: new Date(),
    });
  } catch (error) {
    console.error('Error fetching trends data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends data' },
      { status: 500 }
    );
  }
}
