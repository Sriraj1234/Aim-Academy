import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GenerateRequest {
    subject: string;
    chapter?: string;
    topic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    language: 'english' | 'hindi' | 'hinglish';
    board?: string;
    classLevel?: string;
}

interface GeneratedQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured' },
                { status: 500 }
            );
        }

        const body: GenerateRequest = await request.json();

        if (!body.subject) {
            return NextResponse.json(
                { success: false, error: 'Subject is required' },
                { status: 400 }
            );
        }

        const count = Math.min(body.count || 5, 20); // Max 20 questions at once
        const difficulty = body.difficulty || 'medium';
        const language = body.language || 'hinglish';

        let languageInstruction = '';
        switch (language) {
            case 'hindi':
                languageInstruction = 'STRICT RULE: Write EVERYTHING in Hindi (Devanagari script) ONLY. Do not use English words unless absolutely necessary for technical terms.';
                break;
            case 'english':
                languageInstruction = 'STRICT RULE: Write EVERYTHING in English ONLY.';
                break;
            case 'hinglish':
            default:
                languageInstruction = 'Write in a natural mix of Hindi and English (Hinglish) as spoken by Indian students.';
        }

        const classInstruction = body.classLevel
            ? `STRICTLY generate questions appropriate for ${body.classLevel} level only. Do NOT generate questions for higher or lower classes.`
            : 'Generate questions for Class 10 level.';


        const systemPrompt = `You are an expert question paper setter for Indian board exams (${body.board || 'CBSE/BSEB'}).
${classInstruction}
${languageInstruction}

Generate MCQ questions that are:
- Accurate and factually correct
- Conceptually clear and unambiguous
- ${difficulty === 'easy' ? 'Basic' : difficulty === 'medium' ? 'Moderate' : 'Advanced/Challenging'} difficulty
- RANDOM & UNIQUE: Ensure questions are diverse. Do not repeat standard textbook examples if possible. Use unique scenarios.

CRITICAL: Return ONLY valid JSON array. Each question must have exactly 4 options.`;

        // Inject random seed to force detailed uniqueness
        const randomSeed = Math.random().toString(36).substring(7);

        const userPrompt = `Generate ${count} MCQ questions for:
Subject: ${body.subject}
${body.chapter ? `Chapter: ${body.chapter}` : ''}
${body.topic ? `Topic: ${body.topic}` : ''}
Difficulty: ${difficulty}
seed: ${randomSeed}

${language === 'hindi' ? 'REMEMBER: Output must be in HINDI.' : ''}

Return as JSON array with this exact format:
[
    {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation"
    }
]

IMPORTANT: correctAnswer is 0-indexed. Return ONLY the JSON array, no other text.`;

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
                temperature: 0.9, // Increased for maximum variety
                max_tokens: 4000,
            }),
        });

        if (!response.ok) {
            throw new Error('AI API error');
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || '';

        // Parse questions from response
        let questions: GeneratedQuestion[] = [];
        try {
            // Find JSON array in response
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                questions = parsed.map((q: GeneratedQuestion, index: number) => ({
                    id: `ai-${Date.now()}-${index}`,
                    question: q.question,
                    options: q.options.slice(0, 4), // Ensure exactly 4 options
                    correctAnswer: Math.min(Math.max(0, q.correctAnswer), 3), // Validate index
                    explanation: q.explanation || '',
                    difficulty: difficulty,
                    subject: body.subject,
                    chapter: body.chapter || '',
                    isAIGenerated: true
                }));
            }
        } catch (parseError) {
            console.error('Failed to parse AI questions:', parseError);
            return NextResponse.json(
                { success: false, error: 'Failed to generate valid questions. Please try again.' },
                { status: 500 }
            );
        }

        if (questions.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No questions generated. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            questions,
            count: questions.length
        });
    } catch (error) {
        console.error('Question generation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate questions' },
            { status: 500 }
        );
    }
}
