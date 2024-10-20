
// To connect from python to typescript file.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, currentUrl } = body;

    console.log(`Next.js API: question = ${question}, currentUrl = ${currentUrl}`);

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

    // Log the response headers and status
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in Next.js API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}