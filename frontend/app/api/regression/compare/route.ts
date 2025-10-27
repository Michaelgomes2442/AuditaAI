import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // TODO: Get actual user from session
    const userId = 1;

    // Get all active baselines
    const baselines = await prisma.regressionBaseline.findMany({
      where: { userId, isActive: true },
    });

    if (baselines.length === 0) {
      return NextResponse.json({ comparisons: [] });
    }

    const comparisons = [];

    for (const baseline of baselines) {
      // Get recent tests for comparison (last 20 tests)
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
        // Skip if not enough data
        continue;
      }

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
        sampleSize: recentTests.length,
      };

      // Calculate percentage degradation (positive = worse, negative = better)
      const degradation = {
        responseTime: baseline.avgResponseTime > 0
          ? ((currentMetrics.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100
          : 0,
        cost: baseline.avgCost > 0
          ? ((currentMetrics.avgCost - baseline.avgCost) / baseline.avgCost) * 100
          : 0,
        qualityScore: baseline.avgQualityScore > 0
          ? ((baseline.avgQualityScore - currentMetrics.avgQualityScore) / baseline.avgQualityScore) * 100 // Inverted: lower is worse
          : 0,
        accuracy: baseline.avgAccuracy > 0
          ? ((baseline.avgAccuracy - currentMetrics.avgAccuracy) / baseline.avgAccuracy) * 100 // Inverted: lower is worse
          : 0,
        successRate: baseline.successRate > 0
          ? ((baseline.successRate - currentMetrics.successRate) / baseline.successRate) * 100 // Inverted: lower is worse
          : 0,
      };

      // Check if any metric has degraded beyond threshold
      const degradedMetrics = [];
      if (degradation.responseTime > baseline.alertThreshold) degradedMetrics.push('Response Time');
      if (degradation.cost > baseline.alertThreshold) degradedMetrics.push('Cost');
      if (degradation.qualityScore > baseline.alertThreshold) degradedMetrics.push('Quality Score');
      if (degradation.accuracy > baseline.alertThreshold) degradedMetrics.push('Accuracy');
      if (degradation.successRate > baseline.alertThreshold) degradedMetrics.push('Success Rate');

      comparisons.push({
        baseline,
        currentMetrics,
        degradation,
        hasRegression: degradedMetrics.length > 0,
        degradedMetrics,
      });
    }

    return NextResponse.json({ comparisons });
  } catch (error) {
    console.error('Error comparing baselines:', error);
    return NextResponse.json({ error: 'Failed to compare baselines' }, { status: 500 });
  }
}
