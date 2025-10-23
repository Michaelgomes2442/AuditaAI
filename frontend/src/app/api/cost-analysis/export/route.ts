import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/cost-analysis/export
 * Export cost analysis as CSV
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
        responseTime: true,
        tokenCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV
    const headers = [
      'ID',
      'Date',
      'Model',
      'Provider',
      'Cost (USD)',
      'Response Time (ms)',
      'Tokens',
      'Prompt Preview',
    ];

    const rows = testResults.map(r => [
      r.id,
      r.createdAt.toISOString(),
      r.modelName,
      r.modelProvider,
      r.cost?.toFixed(6) || '0',
      r.responseTime || '0',
      r.tokenCount || '0',
      r.prompt.substring(0, 100).replace(/"/g, '""'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell)}"`).join(',')
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cost-analysis-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting cost analysis:', error);
    return NextResponse.json(
      { error: 'Failed to export cost analysis' },
      { status: 500 }
    );
  }
}
