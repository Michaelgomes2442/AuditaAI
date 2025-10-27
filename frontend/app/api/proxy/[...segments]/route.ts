import { NextRequest } from 'next/server';

async function proxy(request: NextRequest, targetBase: string, pathSegments: string[] = []) {
  if (!targetBase) {
    return new Response(JSON.stringify({ error: 'Server proxy not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const path = pathSegments.join('/');
  const base = targetBase.replace(/\/$/, '');
  const url = new URL(`${base}/${path}`);
  // preserve original query
  url.search = new URL(request.url).search;

  const headers: Record<string, string> = {};
  for (const [k, v] of request.headers.entries()) {
    headers[k] = v;
  }
  // avoid leaking host
  delete headers['host'];

  const init: RequestInit = {
    method: request.method,
    headers,
    body: undefined,
    redirect: 'follow'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(url.toString(), init);
  const body = await res.arrayBuffer();
  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => (responseHeaders[k] = v));

  return new Response(body, { status: res.status, headers: responseHeaders });
}

export async function GET(req: NextRequest, ctx: any) {
  const params: string[] = ctx?.params?.segments ?? [];
  const backend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  return proxy(req, backend ?? '', params);
}

export async function POST(req: NextRequest, ctx: any) {
  const params: string[] = ctx?.params?.segments ?? [];
  const backend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  return proxy(req, backend ?? '', params);
}

export async function PUT(req: NextRequest, ctx: any) {
  const params: string[] = ctx?.params?.segments ?? [];
  const backend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  return proxy(req, backend ?? '', params);
}

export async function DELETE(req: NextRequest, ctx: any) {
  const params: string[] = ctx?.params?.segments ?? [];
  const backend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  return proxy(req, backend ?? '', params);
}
