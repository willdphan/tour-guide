import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, currentUrl } = body;

  console.log(`Next.js API: question = ${question}, currentUrl = ${currentUrl}`);

  if (!question || !currentUrl) {
    return NextResponse.json({ error: 'Question and currentUrl are required' }, { status: 400 });
  }

  const apiUrl = `http://127.0.0.1:8000/api/run-agent/`;

  console.log(`Calling FastAPI URL: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ question, currentUrl }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FastAPI error:', errorText);
    return NextResponse.json({ error: 'FastAPI error', details: errorText }, { status: response.status });
  }

  return new NextResponse(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}