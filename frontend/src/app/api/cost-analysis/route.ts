import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/cost-analysis
 * Get comprehensive cost analysis
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const modelFilter = searchParams.get('model');
    const providerFilter = searchParams.get('provider');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      userId: user.id,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      cost: {
        not: null,
      },
    };

    if (modelFilter && modelFilter !== 'all') {
      where.modelName = modelFilter;
    }

    if (providerFilter && providerFilter !== 'all') {
      where.modelProvider = providerFilter;
    }

    // Fetch test results
    const testResults = await prisma.testResult.findMany({
      where,
      select: {
        id: true,
        modelName: true,
        modelProvider: true,
        cost: true,
        prompt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total cost
    const totalCostAll = await prisma.testResult.aggregate({
      where: { userId: user.id, cost: { not: null } },
      _sum: { cost: true },
    });

    const totalCost = totalCostAll._sum.cost || 0;
    const periodCost = testResults.reduce((sum, r) => sum + (r.cost || 0), 0);

    // Calculate previous period for comparison
    const periodDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
    const previousStart = new Date(new Date(startDate).getTime() - periodDuration);
    const previousEnd = new Date(startDate);

    const previousPeriodResults = await prisma.testResult.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
        cost: { not: null },
      },
      select: { cost: true },
    });

    const previousPeriodCost = previousPeriodResults.reduce((sum, r) => sum + (r.cost || 0), 0);
    const changePercentage = previousPeriodCost > 0
      ? ((periodCost - previousPeriodCost) / previousPeriodCost) * 100
      : 0;

    // Group by model
    const byModel: Map<string, { cost: number; count: number }> = new Map();
    testResults.forEach(r => {
      const existing = byModel.get(r.modelName) || { cost: 0, count: 0 };
      byModel.set(r.modelName, {
        cost: existing.cost + (r.cost || 0),
        count: existing.count + 1,
      });
    });

    // Group by provider
    const byProvider: Map<string, { cost: number; count: number }> = new Map();
    testResults.forEach(r => {
      const existing = byProvider.get(r.modelProvider) || { cost: 0, count: 0 };
      byProvider.set(r.modelProvider, {
        cost: existing.cost + (r.cost || 0),
        count: existing.count + 1,
      });
    });

    // Group by day
    const byDay: Map<string, { cost: number; count: number }> = new Map();
    testResults.forEach(r => {
      const date = r.createdAt.toISOString().split('T')[0];
      const existing = byDay.get(date) || { cost: 0, count: 0 };
      byDay.set(date, {
        cost: existing.cost + (r.cost || 0),
        count: existing.count + 1,
      });
    });

    // Fill in missing days with zero
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDays: Array<{ date: string; cost: number; count: number }> = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const data = byDay.get(dateStr) || { cost: 0, count: 0 };
      allDays.push({ date: dateStr, ...data });
    }

    // Top expensive tests
    const topExpensive = testResults
      .filter(r => r.cost && r.cost > 0)
      .sort((a, b) => (b.cost || 0) - (a.cost || 0))
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        model: r.modelName,
        cost: r.cost || 0,
        prompt: r.prompt,
      }));

    // Forecast
    const avgDailyCost = periodCost / allDays.length;
    const nextWeek = avgDailyCost * 7;
    const nextMonth = avgDailyCost * 30;
    
    // Determine trend
    const firstHalf = allDays.slice(0, Math.floor(allDays.length / 2));
    const secondHalf = allDays.slice(Math.floor(allDays.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';

    // Get budget if exists
    const budget = await prisma.budget.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    let budgetInfo = undefined;
    if (budget) {
      const spent = periodCost;
      const remaining = budget.limit - spent;
      const percentage = (spent / budget.limit) * 100;
      
      budgetInfo = {
        limit: budget.limit,
        spent,
        remaining,
        percentage,
      };
    }

    return NextResponse.json({
      totalCost,
      periodCost,
      previousPeriodCost,
      changePercentage,
      byModel: Array.from(byModel.entries())
        .map(([model, data]) => ({ model, ...data }))
        .sort((a, b) => b.cost - a.cost),
      byProvider: Array.from(byProvider.entries())
        .map(([provider, data]) => ({ provider, ...data }))
        .sort((a, b) => b.cost - a.cost),
      byDay: allDays,
      topExpensive,
      budget: budgetInfo,
      forecast: {
        nextWeek,
        nextMonth,
        trend,
      },
    });
  } catch (error) {
    console.error('Error fetching cost analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost analysis' },
      { status: 500 }
    );
  }
}
