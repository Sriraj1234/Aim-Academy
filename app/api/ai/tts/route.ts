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

        // SSML Wrapper for more natural breaths and pauses
        const synthesisInput = { ssml: `<speak>${text}</speak>` };

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
                    pitch: 0.0, // Natural pitch
                    speakingRate: 0.95 // Slightly slower for better clarity and human-feel
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
