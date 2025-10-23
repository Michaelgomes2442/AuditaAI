import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For deployed sites (Vercel) the browser cannot reach a developer's local Ollama.
    // Indicate that the client should not perform a direct localhost check and
    // provide a server-side proxy path that the frontend can call instead.
    return NextResponse.json({
      available: false,
      models: [],
      hasRequiredModel: false,
      message: 'Ollama status should be requested via server-side proxy. Using backend to query available models when possible.',
      clientSideCheck: false,
      serverProxy: '/api/ollama/tags'
    });
  } catch (error) {
    return NextResponse.json({
      available: false,
      models: [],
      hasRequiredModel: false,
      message: 'Failed to check Ollama status'
    });
  }
}
