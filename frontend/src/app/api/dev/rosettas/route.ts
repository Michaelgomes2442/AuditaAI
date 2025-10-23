import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prismadb';
import fs from 'fs';
import path from 'path';

// GET - Get all Rosetta versions (Architect only)
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

    // Read Rosetta versions from file system or database
    const rosettaDir = path.join(process.cwd(), '../config');
    const rosettas: any[] = [];

    // Check for rosetta-canonical.json
    const canonicalPath = path.join(rosettaDir, 'rosetta-canonical.json');
    if (fs.existsSync(canonicalPath)) {
      const stats = fs.statSync(canonicalPath);
      const content = fs.readFileSync(canonicalPath, 'utf-8');
      const data = JSON.parse(content);
      
      rosettas.push({
        id: 'canonical',
        name: 'Rosetta Canonical',
        version: data.version || '1.0.0',
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        uploadedAt: stats.mtime,
        active: true,
        path: canonicalPath,
      });
    }

    // Check for other rosetta files
    if (fs.existsSync(rosettaDir)) {
      const files = fs.readdirSync(rosettaDir);
      const rosettaFiles = files.filter(f => 
        f.startsWith('rosetta') && 
        (f.endsWith('.json') || f.endsWith('.js')) &&
        f !== 'rosetta-canonical.json'
      );

      for (const file of rosettaFiles) {
        const filePath = path.join(rosettaDir, file);
        const stats = fs.statSync(filePath);
        
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          rosettas.push({
            id: file.replace(/\.(json|js)$/, ''),
            name: file,
            version: data.version || '1.0.0',
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            uploadedAt: stats.mtime,
            active: false,
            path: filePath,
          });
        } catch (err) {
          // Skip invalid files
        }
      }
    }

    return NextResponse.json(rosettas);
  } catch (error) {
    console.error('Error fetching Rosettas:', error);
    return NextResponse.json({ error: 'Failed to fetch Rosettas' }, { status: 500 });
  }
}
