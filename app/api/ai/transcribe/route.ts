import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`Transcribing audio: ${file.name} (${file.size} bytes)`);

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3', // Multilingual support for Hindi/English
            response_format: 'json',
            temperature: 0.0,
        });

        return NextResponse.json({ text: transcription.text });

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
}
