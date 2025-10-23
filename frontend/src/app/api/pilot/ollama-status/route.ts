import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to reach backend's Ollama status endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/pilot/ollama-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If backend fails, try Ollama directly
    const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      const models = data.models || [];
      const hasRequiredModel = models.some((m: any) => m.name === 'llama3.2:3b');

      return NextResponse.json({
        available: true,
        models: models.map((m: any) => m.name),
        hasRequiredModel,
        message: hasRequiredModel 
          ? 'Ollama is running with llama3.2:3b' 
          : 'Ollama is running but llama3.2:3b not found. Run: ollama pull llama3.2:3b'
      });
    }

    throw new Error('Ollama not responding');
  } catch (error) {
    return NextResponse.json({
      available: false,
      models: [],
      hasRequiredModel: false,
      message: 'Ollama is not running. Please install and start Ollama: https://ollama.ai'
    });
  }
}
