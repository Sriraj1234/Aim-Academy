import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface FlashcardResponse {
    term: string;
    definition: string;
    example?: string;
    imageUrl?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { topic, count = 8, classLevel = '10', board = 'CBSE', language = 'english' } = await req.json();

        if (!topic) {
            return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });
        }

        if (!GROQ_API_KEY) {
            return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 500 });
        }

        // Language instructions
        const languageInstruction = language === 'hindi'
            ? 'Generate flashcards in HINDI language. Use Devanagari script.'
            : language === 'hinglish'
                ? 'Generate flashcards in HINGLISH (mix of Hindi and English, written in Roman script).'
                : 'Generate flashcards in ENGLISH.';

        const prompt = `You are an expert educator for Class ${classLevel} (${board} Board).
${languageInstruction}
Generate exactly ${count} HIGH-QUALITY flashcards for the topic: "${topic}".

Context: The student is in Class ${classLevel}. Ensure the difficulty and depth matches this level.
${classLevel === '12' ? 'Include advanced concepts, key formulas, and exam-focused details.' : 'Keep concepts clear, foundational, and easy to remember.'}

Each flashcard MUST have:
- "term": A short keyword, formula, or concept name (2-5 words max)
- "definition": A clear, detailed explanation (2-3 sentences) that helps the student truly understand
- "example": A practical, real-world example or application (1-2 sentences)

IMPORTANT RULES:
1. Make definitions DETAILED and INFORMATIVE, not just one-liners
2. Include examples that make concepts memorable
3. Cover the most important aspects of the topic
4. Use simple language appropriate for Class ${classLevel}
5. Return ONLY a valid JSON array. No markdown, no extra text.

Example format:
[
    {
        "term": "Photosynthesis",
        "definition": "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. It occurs in the chloroplasts of leaf cells.",
        "example": "When you water a plant and keep it in sunlight, it creates its own food through photosynthesis – that's why plants in dark rooms wilt!"
    }
]

Now generate ${count} detailed flashcards for "${topic}":`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Upgraded to larger model
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 3000 // Increased for detailed content
            })
        });

        if (!response.ok) {
            throw new Error('Groq API request failed');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';

        // Parse JSON from response
        let flashcards: FlashcardResponse[];
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = content.match(/```json?\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
            flashcards = JSON.parse(jsonStr.trim());
        } catch (parseError) {
            console.error('Failed to parse flashcards:', parseError);
            return NextResponse.json({ success: false, error: 'Failed to generate flashcards' }, { status: 500 });
        }

        // Fetch images for each flashcard term (in parallel, with timeout)
        const imagePromises = flashcards.map(async (card) => {
            try {
                const searchQuery = `${card.term} ${topic} educational diagram`;
                const imgRes = await fetch(`${req.nextUrl.origin}/api/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, type: 'image' }),
                    signal: AbortSignal.timeout(5000) // 5 second timeout per image
                });

                if (imgRes.ok) {
                    const imgData = await imgRes.json();
                    if (imgData.results && imgData.results.length > 0) {
                        // Pick the first valid image
                        const validImage = imgData.results.find((r: any) => r.url || r.image || r.thumbnail);
                        if (validImage) {
                            card.imageUrl = validImage.url || validImage.image || validImage.thumbnail;
                        }
                    }
                }
            } catch (e) {
                // Image fetch failed, continue without image
                console.log(`Image fetch failed for "${card.term}":`, e);
            }
            return card;
        });

        // Wait for all image fetches (with overall timeout)
        const flashcardsWithImages = await Promise.all(imagePromises);

        return NextResponse.json({ success: true, flashcards: flashcardsWithImages, topic });

    } catch (error) {
        console.error('Flashcard generation error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
