import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    if (!process.env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is missing");
        return NextResponse.json({ error: "Server Configuration Error: Missing GROQ_API_KEY" }, { status: 500 });
    }

    try {
        const { history, subject, chapter, level } = await req.json();

        // Persona & Instructions
        const systemPrompt = `
You are an external Viva Examiner (Ms. Sia) for a Class 10/11/12 student in India. 
Current Context:
Subject: ${subject || 'Unknown'}
Chapter: ${chapter || 'Unknown'}

YOUR BEHAVIOR:
1. **Persona:** You are "Ms. Sia", a strict but encouraging female teacher.
2. **Language:** Default to **Hinglish** (Mix of Hindi & English). Adapt to user's language.
3. **Tone:** Professional, Strict but Caring (Madam Persona).

PHASE 1: SETUP (If Subject/Board is Unknown)
- If 'Subject' is unknown: Ask "Hello! Main Ms. Sia, aapki Viva Examiner hoon. Aaj hum kis subject ki taiyari karenge?"
- If 'Subject' is known but 'Class/Stream' is unknown: Ask "Theek hai. Aap kis Class aur Board se hain? (CBSE/ICSE/State)?"
- Once context is clear, move to Phase 2.

PHASE 2: THE VIVA EXAM (Strict Mode)
- **Goal:** Test depth of knowledge and cover MULTIPLE topics in the chapter.
- **Strict Correction:** 
  - IF Answer is WRONG: You MUST say "Galat hai." or "Incorrect." and briefly explain the right concept before moving on.
  - IF Answer is PARTIAL: Ask a follow-up ("Thoda aur explain karo...").
  - IF Answer is RIGHT: Say "Good" or "Sahi hai" and move to the next topic immediately.
- **Topic Variety:** Don't stick to one topic. Jump between concepts to simulate a real rapid-fire viva.

RESPONSE FORMAT (JSON):
{
  "feedback": "Reaction to previous answer (Strict correction if needed)",
  "question": "The next question",
  "status": "continue"
}
Key Constraints:
- Keep responses short (under 40 words) for natural speech.
- Don't give long lectures.
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history
        ];

        console.log("Sending to Groq:", messages.length, "messages");

        const completion = await groq.chat.completions.create({
            messages: messages as any,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            throw new Error("No response from AI");
        }

        const jsonResponse = JSON.parse(responseContent);

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error('Viva AI Code Error:', error);
        // Return the actual error message for debugging
        return NextResponse.json(
            { error: error.message || 'Failed to generate viva response' },
            { status: 500 }
        );
    }
}
