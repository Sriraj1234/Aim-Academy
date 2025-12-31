import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
    try {
        const { topic, count = 8 } = await req.json();

        if (!topic) {
            return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });
        }

        if (!GROQ_API_KEY) {
            return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 500 });
        }

        const prompt = `You are an expert educator. Generate exactly ${count} flashcards for the topic: "${topic}".

Each flashcard should have:
- A "term" (short keyword, formula, or concept name)
- A "definition" (clear, concise explanation in 1-2 sentences)

IMPORTANT: Return ONLY a valid JSON array. No markdown, no extra text.
Example format:
[
    {"term": "Photosynthesis", "definition": "The process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water."},
    {"term": "Chlorophyll", "definition": "A green pigment in plants that absorbs light energy for photosynthesis."}
]

Now generate ${count} flashcards for "${topic}":`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error('Groq API request failed');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';

        // Parse JSON from response
        let flashcards;
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = content.match(/```json?\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
            flashcards = JSON.parse(jsonStr.trim());
        } catch (parseError) {
            console.error('Failed to parse flashcards:', parseError);
            return NextResponse.json({ success: false, error: 'Failed to generate flashcards' }, { status: 500 });
        }

        return NextResponse.json({ success: true, flashcards, topic });

    } catch (error) {
        console.error('Flashcard generation error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
