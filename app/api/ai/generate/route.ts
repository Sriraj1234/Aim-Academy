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
                languageInstruction = 'Write everything in pure Hindi (Devanagari script).';
                break;
            case 'english':
                languageInstruction = 'Write everything in simple, clear English.';
                break;
            case 'hinglish':
            default:
                languageInstruction = 'You can mix Hindi and English naturally (Hinglish) for better understanding.';
        }

        const systemPrompt = `You are an expert question paper setter for Indian board exams (${body.board || 'CBSE/BSEB'}).
Generate MCQ questions that are:
- Accurate and factually correct
- Age-appropriate for ${body.classLevel || 'Class 10'} students
- ${difficulty === 'easy' ? 'Basic recall and understanding' : difficulty === 'medium' ? 'Application and analysis' : 'Higher-order thinking and evaluation'}

${languageInstruction}

CRITICAL: Return ONLY valid JSON array, no other text. Each question must have exactly 4 options.`;

        const userPrompt = `Generate ${count} MCQ questions for:
Subject: ${body.subject}
${body.chapter ? `Chapter: ${body.chapter}` : ''}
${body.topic ? `Topic: ${body.topic}` : ''}
Difficulty: ${difficulty}

Return as JSON array with this exact format:
[
    {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation why this is correct"
    }
]

IMPORTANT: correctAnswer is 0-indexed (0=A, 1=B, 2=C, 3=D). Return ONLY the JSON array, no other text.`;

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
                temperature: 0.8,
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
