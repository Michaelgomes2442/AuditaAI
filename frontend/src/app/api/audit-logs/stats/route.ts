import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total count
    const total = await prisma.auditRecord.count({
      where: { userId: user.id },
    });

    // Get today's count
    const todayCount = await prisma.auditRecord.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    // Get counts by category
    const categoryStats = await prisma.auditRecord.groupBy({
      by: ['category'],
      where: { userId: user.id },
      _count: true,
    });

    const byCategory: Record<string, number> = {
      AUTH: 0,
      ACCESS: 0,
      DATA: 0,
      CONFIG: 0,
      VERIFICATION: 0,
      SYSTEM: 0,
    };

    categoryStats.forEach((stat) => {
      byCategory[stat.category] = stat._count;
    });

    // Get counts by status
    const statusStats = await prisma.auditRecord.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    });

    const byStatus: Record<string, number> = {
      SUCCESS: 0,
      FAILURE: 0,
      WARNING: 0,
      INFO: 0,
    };

    statusStats.forEach((stat) => {
      byStatus[stat.status] = stat._count;
    });

    return NextResponse.json({
      total,
      today: todayCount,
      byCategory,
      byStatus,
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}
