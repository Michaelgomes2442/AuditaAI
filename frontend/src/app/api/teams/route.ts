import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: {
              include: {
                organization: true,
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
                _count: {
                  select: { members: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const teams = user.teams.map((tm) => tm.team);
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Create organization if user doesn't have one
    let orgId = user.orgId;
    if (!orgId) {
      const org = await prisma.organization.create({
        data: {
          name: `${user.name || user.email}'s Organization`,
          plan: 'TRIAL',
          status: 'ACTIVE',
        },
      });
      
      await prisma.user.update({
        where: { id: user.id },
        data: { orgId: org.id },
      });
      
      orgId = org.id;
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        orgId,
      },
      include: {
        organization: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Add creator as OWNER
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
