export async function GET() {
  // Dev-time stub for /api/auth/providers to avoid 404 and supply minimal provider metadata
  // This helps the client render sign-in options without calling the NextAuth catch-all.
  const providers = {
    credentials: {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      signinUrl: '/signin'
    }
  };
  return new Response(JSON.stringify(providers), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
