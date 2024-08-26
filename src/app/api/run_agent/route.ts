import { NextResponse } from 'next/server';
import { runAgent } from '../pythonBridge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const agentIterator = await runAgent(question);
        
        for await (const step of agentIterator) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(step)}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Error in agent execution:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Agent execution failed' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}