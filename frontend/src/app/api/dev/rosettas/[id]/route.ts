import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prismadb';
import fs from 'fs';
import path from 'path';

// DELETE - Remove a Rosetta version (Architect only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const rosettaId = params.id;

    // Prevent deletion of canonical rosetta
    if (rosettaId === 'canonical' || rosettaId.includes('rosetta-canonical')) {
      return NextResponse.json({ 
        error: 'Cannot delete the active canonical Rosetta' 
      }, { status: 400 });
    }

    // Construct file path
    const rosettaDir = path.join(process.cwd(), '../config');
    const filePath = path.join(rosettaDir, `${rosettaId}.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Rosetta file not found' }, { status: 404 });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log(`✅ Rosetta deleted: ${rosettaId} by ${session.user.email}`);

    return NextResponse.json({ 
      success: true,
      message: `Rosetta version ${rosettaId} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting Rosetta:', error);
    return NextResponse.json({ error: 'Failed to delete Rosetta' }, { status: 500 });
  }
}
