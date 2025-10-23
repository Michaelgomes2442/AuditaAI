import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/templates/[id]/share
 * Share a template with specific users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = parseInt(params.id);
    const template = await prisma.testTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only owner can share
    if (template.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds = [], addUsers = [], removeUsers = [] } = body;

    let newSharedWith = [...template.sharedWith];

    // If userIds is provided, replace the entire list
    if (userIds.length > 0) {
      newSharedWith = userIds;
    } else {
      // Otherwise, add/remove specific users
      if (addUsers.length > 0) {
        newSharedWith = [...new Set([...newSharedWith, ...addUsers])];
      }
      if (removeUsers.length > 0) {
        newSharedWith = newSharedWith.filter(id => !removeUsers.includes(id));
      }
    }

    const updated = await prisma.testTemplate.update({
      where: { id: templateId },
      data: { sharedWith: newSharedWith }
    });

    return NextResponse.json({
      template: updated,
      sharedCount: newSharedWith.length
    });
  } catch (error) {
    console.error('Error sharing template:', error);
    return NextResponse.json(
      { error: 'Failed to share template' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/templates/[id]/share
 * Get list of users template is shared with
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = parseInt(params.id);
    const template = await prisma.testTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only owner can view sharing list
    if (template.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user details for shared users
    const sharedUsers = await prisma.user.findMany({
      where: {
        id: { in: template.sharedWith }
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    return NextResponse.json({
      sharedWith: template.sharedWith,
      sharedUsers,
      sharedCount: template.sharedWith.length
    });
  } catch (error) {
    console.error('Error fetching sharing info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sharing info' },
      { status: 500 }
    );
  }
}
