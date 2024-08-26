import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Your agent logic here
      // This is a placeholder, replace with your actual agent logic
      const steps = [
        {"thought": "", "action": "Click", "instruction": "Click on the Hookalotti.", "element_description": "Hookalotti", "screen_location": {"x": 1051.421875, "y": 648.0, "width": 0.0, "height": 0.0}, "hover_before_action": true, "text_input": null},
        {"thought": "", "action": "ANSWER;", "instruction": "Task completed. Answer: Reached the Hookalotti page.", "element_description": null, "screen_location": null, "hover_before_action": false, "text_input": null}
      ];

      for (const step of steps) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(step)}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
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