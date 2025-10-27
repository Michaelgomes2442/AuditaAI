import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual user from session
    const userId = 1;

    // Get all active baselines
    const baselines = await prisma.regressionBaseline.findMany({
      where: { userId, isActive: true },
    });

    if (baselines.length === 0) {
      return NextResponse.json({ message: 'No active baselines to test' }, { status: 400 });
    }

    const results = {
      tested: 0,
      regressions: 0,
      passed: 0,
    };

    for (const baseline of baselines) {
      // Get recent tests for comparison
      const recentTests = await prisma.testResult.findMany({
        where: {
          userId,
          modelName: baseline.modelName,
          ...(baseline.modelVersion && { modelVersion: baseline.modelVersion }),
          status: 'completed',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (recentTests.length < 3) {
        continue;
      }

      results.tested++;

      // Calculate current metrics
      const currentMetrics = {
        avgResponseTime:
          recentTests.reduce((sum: number, t: any) => sum + (t.responseTime || 0), 0) /
          recentTests.length,
        avgCost:
          recentTests.reduce((sum: number, t: any) => sum + (t.cost || 0), 0) / recentTests.length,
        avgQualityScore:
          recentTests.reduce((sum: number, t: any) => sum + (t.criesScore || 0.8), 0) /
          recentTests.length,
        avgAccuracy:
          recentTests.reduce((sum: number, t: any) => sum + ((t.criesScore || 0.8) * 100), 0) /
          recentTests.length,
        successRate:
          (recentTests.filter((t: any) => t.status === 'completed').length / recentTests.length) *
          100,
      };

      // Calculate degradation
      const degradation = {
        responseTime: baseline.avgResponseTime > 0
          ? ((currentMetrics.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100
          : 0,
        cost: baseline.avgCost > 0
          ? ((currentMetrics.avgCost - baseline.avgCost) / baseline.avgCost) * 100
          : 0,
        qualityScore: baseline.avgQualityScore > 0
          ? ((baseline.avgQualityScore - currentMetrics.avgQualityScore) / baseline.avgQualityScore) * 100
          : 0,
        accuracy: baseline.avgAccuracy > 0
          ? ((baseline.avgAccuracy - currentMetrics.avgAccuracy) / baseline.avgAccuracy) * 100
          : 0,
        successRate: baseline.successRate > 0
          ? ((baseline.successRate - currentMetrics.successRate) / baseline.successRate) * 100
          : 0,
      };

      // Check for regression
      const hasRegression =
        degradation.responseTime > baseline.alertThreshold ||
        degradation.cost > baseline.alertThreshold ||
        degradation.qualityScore > baseline.alertThreshold ||
        degradation.accuracy > baseline.alertThreshold ||
        degradation.successRate > baseline.alertThreshold;

      if (hasRegression) {
        results.regressions++;

        // TODO: Trigger notifications (email, webhook, etc.)
        console.log(`Regression detected for ${baseline.modelName}`);
      } else {
        results.passed++;
      }
    }

    return NextResponse.json({
      message: 'Regression tests completed',
      results,
    });
  } catch (error) {
    console.error('Error running regression tests:', error);
    return NextResponse.json({ error: 'Failed to run regression tests' }, { status: 500 });
  }
}
