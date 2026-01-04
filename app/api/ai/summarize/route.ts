import { NextRequest, NextResponse } from 'next/server';

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

        // === Web Research Phase ===
        let webContext = '';
        let sources: string[] = [];

        if (body.useWebResearch) {
            try {
                const searchQuery = `${body.chapter} ${body.subject} Class ${body.classLevel || '10'} notes explanation`;
                const searchRes = await fetch(`${request.nextUrl.origin}/api/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, type: 'text' }),
                    signal: AbortSignal.timeout(8000) // 8 second timeout
                });

                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (searchData.results && searchData.results.length > 0) {
                        const snippets: WebSnippet[] = searchData.results.slice(0, 5);

                        webContext = `
--- WEB RESEARCH CONTEXT ---
The following information was gathered from the web. Use this to enhance your summary with accurate, up-to-date details:
${snippets.map((s, i) => `[${i + 1}] ${s.title}: ${s.description || ''}`).join('\n')}
--- END WEB CONTEXT ---
`;
                        sources = snippets.map(s => s.url).filter(Boolean);
                    }
                }
            } catch (e) {
                console.log('Web research failed, continuing without:', e);
            }
        }

        const systemPrompt = `You are an expert teacher creating DETAILED, COMPREHENSIVE revision notes for ${body.name ? body.name + ', a ' : ''}${body.board || 'Indian board'} ${body.classLevel || 'Class 10'} student.

Create thorough, in-depth summaries that explain concepts clearly and help with exam preparation.

Rules:
1. Address the student by name (${body.name || 'Student'}) occasionally to keep them engaged.
2. Provide DETAILED explanations for each key point. Be thorough, not brief.
3. Include practical examples and real-world applications where relevant.
4. Use bullet points but ensure each point has a proper explanation.
5. Keep definitions clear, include examples, and explain WHY things work the way they do.
6. Adapt language complexity to Class ${body.classLevel || '10'}.
${languageInstruction}
${webContext}

Format your response as JSON with this structure:
{
    "title": "Chapter title",
    "keyPoints": ["Point 1 with detailed explanation", "Point 2 with detailed explanation", ...],
    "definitions": [{"term": "Term", "meaning": "Detailed definition with example"}, ...],
    "formulas": ["Formula 1 with explanation", "Formula 2 with explanation", ...],
    "importantDates": [{"event": "Event", "date": "Date"}, ...],
    "mnemonics": ["Memory trick 1 with explanation", ...],
    "examTips": ["Tip 1 specific to this chapter", "Tip 2", ...]
}

Include only relevant sections. For science chapters include formulas, for history include dates, etc.
Make each key point INFORMATIVE and EXAM-FOCUSED.`;

        const userPrompt = `Create comprehensive revision notes for:
Subject: ${body.subject}
Chapter: ${body.chapter}
Class: ${body.classLevel || '10'}
Board: ${body.board || 'CBSE/BSEB'}

Focus on:
- ALL key concepts students must remember for exams
- Important definitions with examples
- Formulas and their applications (if applicable)
- Important dates/events (if applicable)
- Memory tricks that actually help
- Specific exam tips for this chapter

IMPORTANT:
1. Be DETAILED and COMPREHENSIVE - this should be enough for complete revision
2. Include examples wherever possible
3. Return ONLY the JSON, no markdown formatting.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
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
