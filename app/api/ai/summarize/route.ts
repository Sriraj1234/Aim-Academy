import { NextRequest, NextResponse } from 'next/server';
import { performImageSearch } from '@/lib/search';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface SummarizeRequest {
    subject: string;
    chapter: string;
    classLevel?: string;
    board?: string;
    name?: string;
    language?: 'english' | 'hindi' | 'hinglish';
    useWebResearch?: boolean;
}

interface WebSnippet {
    title: string;
    description?: string;
    url: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured' },
                { status: 500 }
            );
        }

        const body: SummarizeRequest = await request.json();

        if (!body.subject || !body.chapter) {
            return NextResponse.json(
                { success: false, error: 'Subject and chapter are required' },
                { status: 400 }
            );
        }

        const language = body.language || 'hinglish';
        let languageInstruction = '';

        switch (language) {
            case 'hindi':
                languageInstruction = 'Write in pure Hindi (Devanagari script).';
                break;
            case 'english':
                languageInstruction = 'Write in simple, clear English.';
                break;
            default:
                languageInstruction = 'Use Hinglish (Hindi-English mix) for better understanding.';
        }

        // === Web & Image Research Phase ===
        let webContext = '';
        let sources: string[] = [];
        let images: any[] = [];

        if (body.useWebResearch) {
            try {
                const searchQuery = `${body.chapter} ${body.subject} Class ${body.classLevel || '10'} notes`;

                // Run Text and Image Search in Parallel
                const [searchRes, imageRes] = await Promise.all([
                    fetch(`${request.nextUrl.origin}/api/search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: searchQuery + " explanation", type: 'text' }),
                        signal: AbortSignal.timeout(8000)
                    }).then(res => res.ok ? res.json() : null).catch(() => null),

                    performImageSearch(searchQuery + " diagram chart").catch(() => [])
                ]);

                // Process Text Results
                if (searchRes && searchRes.results?.length > 0) {
                    const snippets: WebSnippet[] = searchRes.results.slice(0, 4);
                    webContext = `
--- WEB CONTEXT (Real-time Data) ---
${snippets.map((s: WebSnippet, i: number) => `[${i + 1}] ${s.title}: ${s.description}`).join('\n')}
--- END WEB CONTEXT ---`;
                    sources = snippets.map((s: WebSnippet) => s.url);
                }

                // Process Image Results
                if (imageRes && imageRes.length > 0) {
                    images = imageRes.slice(0, 6); // Take top 6 images
                }

            } catch (e) {
                console.log('Research failed:', e);
            }
        }

        const systemPrompt = `You are a World-Class Educator creating PREMIUM REVISION NOTES for ${body.name || 'Student'} (${body.classLevel || 'Class 10'}, ${body.board || 'CBSE'}).

GOAL: create notes so good that the student doesn't need to open their textbook.

STRUCTURE (JSON):
{
    "title": "Creative Chapter Title",
    "keyPoints": ["**Bold Concept**: Detailed explanation...", ...],
    "definitions": [{"term": "Term", "meaning": "Simple definition + Real life example"}, ...],
    "formulas": ["Formula = ... (Variables explained)"],
    "importantDates": [{"event": "Event", "date": "Date"}],
    "mnemonics": ["Funny/Easy memory trick"],
    "examTips": ["Common mistake to avoid", "Hot topic for exams"]
}

RULES:
1. **Depth**: Don't just list points. EXPLAIN them. Use 2-3 sentences per point.
2. **Formatting**: Use Markdown (**bold**, *italics*) inside the strings to highlight keywords.
3. **Tone**: Encouraging, academic but accessible.
4. **Context**: Use the provided Web Context if available for latest info.
${languageInstruction}
${webContext}

Format as JSON. Response must be ONLY valid JSON.
`;


        const userPrompt = `Create comprehensive revision notes for:
            Subject: ${body.subject}
        Chapter: ${body.chapter}
        Class: ${body.classLevel || '10'}
        Board: ${body.board || 'CBSE/BSEB'}

Focus on:
        - ALL key concepts students must remember for exams
            - Important definitions with examples
            - Formulas and their applications(if applicable)
            - Important dates / events(if applicable)
            - Memory tricks that actually help
                - Specific exam tips for this chapter

IMPORTANT:
            1. Be DETAILED and COMPREHENSIVE - this should be enough for complete revision
2. Include examples wherever possible
        3. Return ONLY the JSON, no markdown formatting.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY} `,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000, // Increased for comprehensive notes
            }),
        });

        if (!response.ok) {
            throw new Error('AI API error');
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || '';

        // Parse summary from response
        let summary = null;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                summary = JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Return raw response if parsing fails
            summary = {
                title: body.chapter,
                keyPoints: [aiResponse.slice(0, 500)],
                definitions: [],
                formulas: [],
                importantDates: [],
                mnemonics: [],
                examTips: []
            };
        }

        return NextResponse.json({
            success: true,
            summary,
            sources: body.useWebResearch ? sources : undefined,
            images: body.useWebResearch ? images : undefined, // Return images
            metadata: {
                subject: body.subject,
                chapter: body.chapter,
                webResearchUsed: body.useWebResearch || false,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Summarize API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
