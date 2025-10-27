import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);
    
    if (isNaN(userId)) {
      return new NextResponse('Invalid user ID', { status: 400 });
    }

    const log = await prisma.auditRecord.create({
      data: {
        userId: userId,
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