import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prismadb';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// POST - Upload new Rosetta version (Architect only)
export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.json') && !file.name.endsWith('.js') && !file.name.endsWith('.ts')) {
      return NextResponse.json({ error: 'Invalid file type. Only JSON, JS, or TS files are allowed.' }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to config directory
    const rosettaDir = path.join(process.cwd(), '../config');
    if (!fs.existsSync(rosettaDir)) {
      fs.mkdirSync(rosettaDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext);
    const fileName = `${baseName}-${timestamp}${ext}`;
    const filePath = path.join(rosettaDir, fileName);

    // Write file
    await writeFile(filePath, buffer);

    // Log the upload
    console.log(`✅ Rosetta uploaded: ${fileName} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Rosetta uploaded successfully',
      filename: fileName,
      path: filePath,
    });
  } catch (error) {
    console.error('Error uploading Rosetta:', error);
    return NextResponse.json({ error: 'Failed to upload Rosetta' }, { status: 500 });
  }
}
