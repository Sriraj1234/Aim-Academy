import { NextRequest, NextResponse } from 'next/server';
import { getAIExplanation, ExplanationRequest } from '@/lib/groq';

export async function POST(request: NextRequest) {
    try {
        const body: ExplanationRequest = await request.json();

        // Validate required fields
        if (!body.question || !body.options || body.correctAnswer === undefined || body.userAnswer === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Don't explain if user got it right
        if (body.correctAnswer === body.userAnswer) {
            return NextResponse.json(
                { success: false, error: 'This answer was correct, no explanation needed' },
                { status: 400 }
            );
        }

        // Get AI explanation
        const result = await getAIExplanation(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Failed to get explanation' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            explanation: result.explanation,
            tip: result.tip
        });
    } catch (error) {
        console.error('AI Explain API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
