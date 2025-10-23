import { NextResponse } from 'next/server';
import { checkAuthSession } from '@/lib/auth';

export async function GET() {
  const { isAdmin } = await checkAuthSession();

  if (!isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.json({ status: 'ok' });
}