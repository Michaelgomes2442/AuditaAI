import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/templates
 * Fetch all templates accessible to the user
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

    // Fetch templates:
    // 1. User's own templates
    // 2. Public templates
    // 3. Templates shared with user
    // 4. Predefined system templates
    const templates = await prisma.testTemplate.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isPublic: true },
          { isPredefined: true },
          { sharedWith: { has: user.id } }
        ]
      },
      orderBy: [
        { isPredefined: 'desc' },
        { useCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Create a new template
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
      category,
      tags = [],
      config,
      isPublic = false,
      teamId = null,
    } = body;

    if (!name || !category || !config) {
      return NextResponse.json(
        { error: 'Name, category, and config are required' },
        { status: 400 }
      );
    }

    const template = await prisma.testTemplate.create({
      data: {
        name,
        description,
        category,
        userId: user.id,
        teamId,
        isPublic,
        isPredefined: false,
        tags: Array.isArray(tags) ? tags : [],
        config,
        sharedWith: [],
        useCount: 0,
        favoriteCount: 0,
        version: '1.0.0',
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
