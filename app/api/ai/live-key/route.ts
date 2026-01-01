import { NextResponse } from 'next/server';

export async function GET() {
    // Return the API key to the client securely
    // In production, we'd use a proxy to avoid exposing the key, but for Gemini Live WebSocket, 
    // we need to pass the key in the URL query param on the client side currently.
    // Ideally, we should use an OAuth token or a proxy WebSocket, but for MVP:
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    return NextResponse.json({ key });
}
