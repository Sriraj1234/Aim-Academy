import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    try {
        // Fetch list of models from Google API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            const modelNames = data.models
                .filter((m: any) => m.name.includes('gemini')) // Filter for Gemini models
                .map((m: any) => ({
                    name: m.name,
                    displayName: m.displayName,
                    description: m.description,
                    supportedGenerationMethods: m.supportedGenerationMethods
                }));
            return NextResponse.json({ count: modelNames.length, models: modelNames });
        } else {
            return NextResponse.json(data);
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
