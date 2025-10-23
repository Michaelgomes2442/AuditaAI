import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For Vercel deployment, we can't check local Ollama from server-side
    // Return a response that indicates client-side checking is needed
    return NextResponse.json({
      available: false,
      models: [],
      hasRequiredModel: false,
      message: 'Ollama status must be checked from client-side. Click "Recheck" to test local Ollama connection.',
      clientSideCheck: true
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
