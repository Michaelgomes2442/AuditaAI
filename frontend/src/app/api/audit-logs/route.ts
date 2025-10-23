import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/audit-logs
 * Fetch audit logs with filtering and pagination
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
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

    // Fetch logs with user information
    const [logs, total] = await Promise.all([
      prisma.auditRecord.findMany({
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
        take: limit,
        skip: offset,
      }),
      prisma.auditRecord.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit-logs
 * Create a new audit log entry
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
    const { action, category, details, metadata, status, hashPointer } = body;

    if (!action || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: action, category' },
        { status: 400 }
      );
    }

    // Get current Lamport clock value
    let lamportState = await prisma.lamportState.findUnique({
      where: { key: 'global_lamport' },
    });

    if (!lamportState) {
      lamportState = await prisma.lamportState.create({
        data: {
          key: 'global_lamport',
          value: '0',
          lamport: 0,
        },
      });
    }

    const newLamport = lamportState.lamport + 1;

    // Create audit log
    const auditLog = await prisma.auditRecord.create({
      data: {
        userId: user.id,
        action,
        category,
        details: details || {},
        metadata: metadata || {},
        status: status || 'INFO',
        lamport: newLamport,
        hashPointer: hashPointer || null,
      },
    });

    // Update Lamport clock
    await prisma.lamportState.update({
      where: { key: 'global_lamport' },
      data: {
        lamport: newLamport,
        value: newLamport.toString(),
      },
    });

    return NextResponse.json(auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
