import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/audit-logs/export
 * Export audit logs as JSON or CSV
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
    const format = searchParams.get('format') || 'json';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause (same as main query)
    const where: any = {
      userId: user.id,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.action = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Fetch all matching logs (limit to 10000 for safety)
    const logs = await prisma.auditRecord.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000,
    });

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID',
        'Timestamp',
        'User Email',
        'User Name',
        'Action',
        'Category',
        'Status',
        'Lamport',
        'Hash Pointer',
        'Details',
        'Metadata',
      ];

      const rows = logs.map((log) => [
        log.id,
        log.createdAt.toISOString(),
        log.user?.email || '',
        log.user?.name || '',
        log.action,
        log.category,
        log.status,
        log.lamport,
        log.hashPointer || '',
        JSON.stringify(log.details),
        JSON.stringify(log.metadata),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
        },
      });
    } else {
      // Return as JSON
      const json = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          totalRecords: logs.length,
          filters: {
            category: category || 'ALL',
            status: status || 'ALL',
            startDate: startDate || null,
            endDate: endDate || null,
            search: search || null,
          },
          logs,
        },
        null,
        2
      );

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
