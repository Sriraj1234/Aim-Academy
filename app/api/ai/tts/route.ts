import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text, language = 'hi-IN' } = await req.json();
        const apiKey = process.env.GOOGLE_TTS_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'TTS API Key missing' }, { status: 500 });
        }

        // Use Google Cloud Neural2 voices (Premium, most Human-like)
        // en-IN-Neural2-D is a high-quality Female Indian English voice
        const voiceName = 'en-IN-Neural2-D';

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        // Switch to Plain Text to prevent SSML errors (which cause fallback to robotic voice)
        const synthesisInput = { text: text };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: synthesisInput,
                voice: { languageCode: 'en-IN', name: voiceName },
                audioConfig: {
                    audioEncoding: 'MP3',
                    pitch: 0.0,
                    speakingRate: 1.0 // Natural speed
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return NextResponse.json({ audioContent: data.audioContent });

    } catch (error: any) {
        console.error('TTS Error:', error);
        return NextResponse.json({ error: error.message || 'TTS Failed' }, { status: 500 });
    }
}
