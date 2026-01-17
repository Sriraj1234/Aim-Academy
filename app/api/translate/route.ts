
import { NextResponse } from 'next/server';
import translate from 'google-translate-api-x';

export async function POST(req: Request) {
    try {
        const { text, target } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // Handle array of strings or single string
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const results = [];

        for (const t of textsToTranslate) {
            // Using 'auto' for source language detection by default
            const res = await translate(t, { to: target || 'en', autoCorrect: true }) as any;
            results.push(res.text);
        }

        return NextResponse.json({
            translatedText: Array.isArray(text) ? results : results[0]
        });

    } catch (error) {
        console.error("Translation Error:", error);
        return NextResponse.json({ error: "Translation failed", details: String(error) }, { status: 500 });
    }
}
