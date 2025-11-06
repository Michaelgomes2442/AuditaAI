import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prismadb';
const bcrypt = require('bcryptjs');

// GET - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions as any) as any;
    
    console.log('[Profile API] Session:', {
      hasSession: !!session,
      email: session?.user?.email,
      id: session?.user?.id
    });
    
    if (!session?.user?.email) {
      console.warn('[Profile API] No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        permissions: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // If user not found in database, create a default profile from session
    if (!user) {
      console.warn('[Profile API] User not found in database, creating default profile from session');
      user = {
        id: session.user.id || 'unknown',
        email: session.user.email,
        name: session.user.name || null,
        role: session.user.role || 'USER',
        tier: session.user.tier || 'FREE',
        permissions: [],
        status: 'ACTIVE',
        createdAt: new Date(),
        lastLoginAt: new Date()
      } as any;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password required to change password' },
          { status: 400 }
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        permissions: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
