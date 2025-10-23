import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { isActive } = await req.json();

    const baseline = await prisma.regressionBaseline.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ baseline });
  } catch (error) {
    console.error('Error updating baseline:', error);
    return NextResponse.json({ error: 'Failed to update baseline' }, { status: 500 });
  }
}
