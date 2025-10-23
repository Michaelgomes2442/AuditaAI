import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prismadb';
import fs from 'fs';
import path from 'path';

// POST - Compare two Rosetta versions (Architect only)
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

    const body = await request.json();
    const { rosetta1, rosetta2 } = body;

    if (!rosetta1 || !rosetta2) {
      return NextResponse.json({ error: 'Both Rosetta IDs required' }, { status: 400 });
    }

    // Load both files
    const rosettaDir = path.join(process.cwd(), '../config');
    const file1Path = rosetta1 === 'canonical' 
      ? path.join(rosettaDir, 'rosetta-canonical.json')
      : path.join(rosettaDir, `${rosetta1}.json`);
    const file2Path = rosetta2 === 'canonical'
      ? path.join(rosettaDir, 'rosetta-canonical.json')
      : path.join(rosettaDir, `${rosetta2}.json`);

    if (!fs.existsSync(file1Path) || !fs.existsSync(file2Path)) {
      return NextResponse.json({ error: 'One or both Rosetta files not found' }, { status: 404 });
    }

    const data1 = JSON.parse(fs.readFileSync(file1Path, 'utf-8'));
    const data2 = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));

    // Compare the structures
    const comparison = compareObjects(data1, data2);

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error comparing Rosettas:', error);
    return NextResponse.json({ error: 'Failed to compare Rosettas' }, { status: 500 });
  }
}

function compareObjects(obj1: any, obj2: any, path: string = ''): any {
  const changes: any[] = [];
  let added = 0;
  let removed = 0;
  let modified = 0;

  // Check for added and modified keys
  for (const key in obj2) {
    const newPath = path ? `${path}.${key}` : key;
    
    if (!(key in obj1)) {
      added++;
      changes.push({
        type: 'added',
        path: newPath,
        description: `New field added`,
        value: obj2[key],
      });
    } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      const nested = compareObjects(obj1[key], obj2[key], newPath);
      added += nested.added;
      removed += nested.removed;
      modified += nested.modified;
      changes.push(...nested.changes);
    } else if (obj1[key] !== obj2[key]) {
      modified++;
      changes.push({
        type: 'modified',
        path: newPath,
        description: `Value changed`,
        oldValue: obj1[key],
        newValue: obj2[key],
      });
    }
  }

  // Check for removed keys
  for (const key in obj1) {
    if (!(key in obj2)) {
      const newPath = path ? `${path}.${key}` : key;
      removed++;
      changes.push({
        type: 'removed',
        path: newPath,
        description: `Field removed`,
        value: obj1[key],
      });
    }
  }

  return { added, removed, modified, changes };
}
