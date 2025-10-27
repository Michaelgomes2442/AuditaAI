import { prisma } from "../../../lib/prismadb";

export async function GET(req: Request) {
  // Support Bearer <email> for local integration tests
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const user = await prisma.user.findUnique({ where: { email: token } });
    if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });
    return new Response(JSON.stringify({ ok: true, user: { id: user.id, email: user.email } }));
  }

  return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });
}
