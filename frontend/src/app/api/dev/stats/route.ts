import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prismadb';
import os from 'os';

// GET - Get system stats (Architect only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is architect
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (currentUser?.role !== 'ARCHITECT') {
      return NextResponse.json({ error: 'Forbidden - Architect access only' }, { status: 403 });
    }

    // Get user stats
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });
    const architects = await prisma.user.count({
      where: { role: 'ARCHITECT' },
    });
    const admins = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    const auditors = await prisma.user.count({
      where: { role: 'AUDITOR' },
    });

    // Get database stats (approximate)
    const userRecords = await prisma.user.count();
    const sessionRecords = await prisma.session.count();
    const auditRecords = await prisma.auditRecord.count();
    const totalRecords = userRecords + sessionRecords + auditRecords;

    // System stats
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(os.totalmem() / 1024 / 1024);
    const cpuUsage = Math.round(os.loadavg()[0] * 100);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        architects,
        admins,
        auditors,
      },
      database: {
        size: `${Math.round(totalRecords / 100)}MB`, // Rough estimate
        tables: 15, // Update this based on your schema
        records: totalRecords,
        lastBackup: 'Never', // Implement backup tracking if needed
      },
      system: {
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        memory: `${memoryUsedMB}/${totalMemoryMB}MB`,
        cpu: `${cpuUsage}%`,
        requests: 0, // Implement request tracking if needed
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
