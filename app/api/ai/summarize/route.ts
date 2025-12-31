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

        const systemPrompt = `You are an expert teacher creating DETAILED revision notes for ${body.name ? body.name + ', a ' : ''}${body.board || 'Indian board'} ${body.classLevel || 'Class 10'} student.
Create comprehensive, in-depth summaries that explain concepts clearly.
Rules:
1. Address the student by name (${body.name || 'Student'}) occasionally to keep them engaged.
2. Provide DETAILED explanations for each key point. Do not be too brief.
3. Use bullet points but ensure each point has a proper explanation.
4. Keep definitions clear and include examples.
5. Adapt language complexity to Class ${body.classLevel || '10'}.
${languageInstruction}

Format your response as JSON with this structure:
{
    "title": "Chapter title",
    "keyPoints": ["Point 1", "Point 2", ...],
    "definitions": [{"term": "Term", "meaning": "Definition"}, ...],
    "formulas": ["Formula 1", "Formula 2", ...],
    "importantDates": [{"event": "Event", "date": "Date"}, ...],
    "mnemonics": ["Memory trick 1", ...],
    "examTips": ["Tip 1", "Tip 2"]
}

Include only relevant sections. For science chapters include formulas, for history include dates, etc.
Keep each point SHORT and memorable.`;

        const userPrompt = `Create quick revision notes for:
Subject: ${body.subject}
Chapter: ${body.chapter}
Class: ${body.classLevel || '10'}
Board: ${body.board || 'CBSE/BSEB'}

Focus on:
- Key concepts students must remember
- Important definitions
- Formulas (if applicable)
- Important dates/events (if applicable)
- Memory tricks

IMPORTANT: If any explanation is long, break it into smaller "chunks" or bullets. Do not output walls of text. Return ONLY the JSON.`;

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
                max_tokens: 2500, // Increased for detailed notes
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
            metadata: {
                subject: body.subject,
                chapter: body.chapter,
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
