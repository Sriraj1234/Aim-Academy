import { NextResponse } from 'next/server';

export async function GET() {
    // Determine the API key to use
    // Priority: GEMINI_LIVE_API_KEY (specific) -> GEMINI_API_KEY (generic)
    const apiKey = process.env.GEMINI_LIVE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('Gemini API Key is missing on server');
        return NextResponse.json(
            { error: 'Server configuration error: API Key missing' },
            { status: 500 }
        );
    }

    return NextResponse.json({ key: apiKey });
}
