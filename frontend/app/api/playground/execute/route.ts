import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider, model, temperature, maxTokens, topP, streaming } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // For streaming responses
    if (streaming) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Simulate streaming response
            // In production, this would call the actual LLM API
            const mockResponse = `This is a simulated streaming response from ${model} (${provider}).

Your prompt was: "${prompt}"

Configuration:
- Temperature: ${temperature}
- Max Tokens: ${maxTokens}
- Top P: ${topP}

This is placeholder text demonstrating the streaming functionality. In production, this would connect to the actual ${provider} API and stream real responses token by token.

The playground allows you to:
1. Test different models and providers
2. Adjust parameters in real-time
3. See streaming responses
4. Save successful prompts as templates
5. Review execution history

You can use this to experiment with prompts before creating formal tests.`;

            // Simulate streaming by sending chunks
            const words = mockResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = (i === 0 ? words[i] : ' ' + words[i]);
              const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
              
              // Small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 20));
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For non-streaming responses
    const mockResponse = `This is a simulated response from ${model} (${provider}).

Your prompt was: "${prompt}"

Configuration:
- Temperature: ${temperature}
- Max Tokens: ${maxTokens}
- Top P: ${topP}

This is placeholder text. In production, this would call the actual ${provider} API.`;

    return NextResponse.json({
      response: mockResponse,
      tokenCount: Math.ceil(mockResponse.length / 4),
      cost: 0.002,
      model,
      provider,
    });
  } catch (error) {
    console.error('Error executing playground request:', error);
    return NextResponse.json({ error: 'Failed to execute request' }, { status: 500 });
  }
}
