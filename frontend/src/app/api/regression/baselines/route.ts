import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // TODO: Get actual user from session
    const userId = 1;

    const baselines = await prisma.regressionBaseline.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ baselines });
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return NextResponse.json({ error: 'Failed to fetch baselines' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual user from session
    const userId = 1;
    const { modelName, modelVersion, testType, alertThreshold } = await req.json();

    if (!modelName || !testType) {
      return NextResponse.json(
        { error: 'modelName and testType are required' },
        { status: 400 }
      );
    }

    // Calculate baseline metrics from recent test results
    const recentTests = await prisma.testResult.findMany({
      where: {
        userId,
        modelName,
        ...(modelVersion && { modelVersion }),
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Use last 100 tests as baseline
    });

    if (recentTests.length < 10) {
      return NextResponse.json(
        { error: 'Not enough test data to establish baseline (minimum 10 tests required)' },
        { status: 400 }
      );
    }

    // Calculate average metrics
    const avgResponseTime =
      recentTests.reduce((sum: number, t: any) => sum + (t.responseTime || 0), 0) / recentTests.length;
    const avgCost = recentTests.reduce((sum: number, t: any) => sum + (t.cost || 0), 0) / recentTests.length;
    
    // Quality score from CRIES score or default
    const avgQualityScore =
      recentTests.reduce((sum: number, t: any) => {
        return sum + (t.criesScore || 0.8); // Use criesScore field
      }, 0) / recentTests.length;

    // Accuracy calculation - use criesScore as proxy
    const avgAccuracy =
      recentTests.reduce((sum: number, t: any) => {
        return sum + ((t.criesScore || 0.8) * 100); // Convert to percentage
      }, 0) / recentTests.length;

    // Success rate
    const successRate = (recentTests.filter((t: any) => t.status === 'completed').length / recentTests.length) * 100;

    // Create or update baseline
    const baseline = await prisma.regressionBaseline.upsert({
      where: {
        userId_modelName_modelVersion_testType: {
          userId,
          modelName,
          modelVersion: modelVersion || '',
          testType,
        },
      },
      update: {
        avgResponseTime,
        avgCost,
        avgQualityScore,
        avgAccuracy,
        successRate,
        alertThreshold: alertThreshold || 10.0,
        sampleSize: recentTests.length,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        modelName,
        modelVersion: modelVersion || null,
        testType,
        avgResponseTime,
        avgCost,
        avgQualityScore,
        avgAccuracy,
        successRate,
        alertThreshold: alertThreshold || 10.0,
        sampleSize: recentTests.length,
        isActive: true,
      },
    });

    return NextResponse.json({ baseline });
  } catch (error) {
    console.error('Error creating baseline:', error);
    return NextResponse.json({ error: 'Failed to create baseline' }, { status: 500 });
  }
}
