import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';

export async function POST() {
  const session = await getServerSession();
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const log = await prisma.auditRecord.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'TEST_EVENT',
        category: 'SYSTEM',
        details: 'Test log entry created via E2E test',
        lamport: 0 // This should be handled by your Lamport clock mechanism
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating test log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}