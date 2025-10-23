import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/heatmap
 * Generate heatmap data from test results
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
    const metricFilter = searchParams.get('metric');
    const modelFilter = searchParams.get('model');

    // Fetch recent test results for the user
    const testResults = await prisma.testResult.findMany({
      where: {
        userId: user.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Analyze last 100 tests
    });

    if (testResults.length === 0) {
      return NextResponse.json({
        models: [],
        metrics: [],
        data: [],
        metadata: { min: 0, max: 0, avg: 0 },
      });
    }

    // Extract unique models
    const modelsSet = new Set<string>();
    testResults.forEach(result => {
      if (result.modelName) {
        modelsSet.add(result.modelName);
      }
    });

    let models = Array.from(modelsSet).sort();
    
    // Apply model filter
    if (modelFilter && modelFilter !== 'all') {
      models = models.filter(m => m === modelFilter);
    }

    // Define metrics to analyze
    const allMetrics = [
      'Response Time',
      'Cost per Request',
      'Quality Score',
      'Throughput',
      'Success Rate',
      'Accuracy',
    ];

    let metrics = allMetrics;
    
    // Apply metric filter
    if (metricFilter && metricFilter !== 'all') {
      metrics = [metricFilter];
    }

    // Build heatmap data matrix
    const data: (number | null)[][] = [];
    const allValues: number[] = [];

    for (const model of models) {
      const row: (number | null)[] = [];
      
      for (const metric of metrics) {
        const value = calculateMetricForModel(model, metric, testResults);
        row.push(value);
        if (value !== null) {
          allValues.push(value);
        }
      }
      
      data.push(row);
    }

    // Calculate metadata
    const validValues = allValues.filter(v => v !== null && !isNaN(v));
    const min = validValues.length > 0 ? Math.min(...validValues) : 0;
    const max = validValues.length > 0 ? Math.max(...validValues) : 0;
    const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

    return NextResponse.json({
      models,
      metrics,
      data,
      metadata: {
        min,
        max,
        avg,
      },
    });
  } catch (error) {
    console.error('Error generating heatmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate heatmap' },
      { status: 500 }
    );
  }
}

/**
 * Calculate a specific metric value for a model based on test results
 */
function calculateMetricForModel(
  model: string,
  metric: string,
  testResults: any[]
): number | null {
  // Filter results for this model
  const modelResults = testResults.filter(result => result.modelName === model);

  if (modelResults.length === 0) {
    return null;
  }

  switch (metric) {
    case 'Response Time':
      // Average response time in milliseconds
      const responseTimes = modelResults
        .map(r => r.responseTime)
        .filter(t => t !== null && t !== undefined);
      return responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

    case 'Cost per Request':
      // Average cost per request
      const costs = modelResults
        .map(r => r.cost)
        .filter(c => c !== null && c !== undefined);
      return costs.length > 0
        ? costs.reduce((a, b) => a + b, 0) / costs.length
        : null;

    case 'Quality Score':
      // Average quality score (0-100)
      const qualityScores = modelResults
        .map(r => {
          // Try to extract quality from response or calculate
          if (r.qualityScore !== null && r.qualityScore !== undefined) {
            return r.qualityScore;
          }
          // Calculate based on status and CRIES score
          if (r.status === 'completed' && r.criesScore) {
            return r.criesScore;
          }
          return r.status === 'completed' ? 80 : 20;
        })
        .filter(s => s !== null);
      return qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : null;

    case 'Throughput':
      // Requests per second (inverse of response time)
      const avgResponseTime = modelResults
        .map(r => r.responseTime)
        .filter(t => t !== null && t !== undefined)
        .reduce((a, b) => a + b, 0) / modelResults.length;
      return avgResponseTime > 0 ? 1000 / avgResponseTime : null;

    case 'Success Rate':
      // Percentage of successful requests
      const successCount = modelResults.filter(r => r.status === 'completed').length;
      return (successCount / modelResults.length) * 100;

    case 'Accuracy':
      // Average accuracy score (if available)
      const accuracyScores = modelResults
        .map(r => {
          // Use CRIES score as accuracy indicator
          if (r.criesScore !== null && r.criesScore !== undefined) {
            return r.criesScore;
          }
          // Default based on status
          return r.status === 'completed' ? 85 : 30;
        })
        .filter(a => a !== null);
      return accuracyScores.length > 0
        ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length
        : null;

    default:
      return null;
  }
}
