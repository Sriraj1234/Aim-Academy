import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { history, subject, chapter, level } = await req.json();

        // Persona & Instructions
        const systemPrompt = `
You are an external Viva Examiner for a Class 10/11/12 student in India. 
Subject: ${subject}
Chapter: ${chapter}
Difficulty: ${level || 'Medium'}

Your Goal: Conduct a realistic oral exam (Viva Voce).
1. Ask ONE conceptual question at a time.
2. Verify the student's previous answer (if any).
3. If they are wrong, correct them briefly.
4. If they are right, appreciate briefly.
5. Then ask the NEXT relevant question.
6. Keep the tone professional but encouraging (like a strict but kind teacher).
7. Keep responses concise (under 40 words) perfectly suitable for Text-to-Speech interaction.

Return your response in strict JSON format:
{
  "feedback": "Short feedback on previous answer (or 'Welcome' if starting)",
  "question": "The actual question to ask",
  "status": "continue" | "finished"
}
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history
        ];

        const completion = await groq.chat.completions.create({
            messages: messages as any,
            model: "llama3-70b-8192", // High intelligence for logic
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            throw new Error("No response from AI");
        }

        const jsonResponse = JSON.parse(responseContent);

        return NextResponse.json(jsonResponse);

    } catch (error) {
        console.error('Viva AI error:', error);
        return NextResponse.json(
            { error: 'Failed to generate viva response' },
            { status: 500 }
        );
    }
}
