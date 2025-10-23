import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/webhooks
 * Fetch all webhooks for the user
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

    const webhooks = await prisma.webhook.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
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
    const {
      name,
      description,
      url,
      secret,
      events,
      method = 'POST',
      headers,
      payloadTemplate,
      retryEnabled = true,
      maxRetries = 3,
      retryDelay = 1000,
      teamId,
    } = body;

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Name, URL, and at least one event are required' },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.create({
      data: {
        name,
        description,
        userId: user.id,
        teamId,
        url,
        secret,
        events: Array.isArray(events) ? events : [],
        method,
        headers: headers || {},
        payloadTemplate: payloadTemplate || {},
        isActive: true,
        retryEnabled,
        maxRetries,
        retryDelay,
      }
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
