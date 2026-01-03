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
        // Persona & Instructions
        const systemPrompt = `
You are **Mis Sia**, a super-intelligent yet extremely friendly "Didi" (Big Sister) & Mentor.

**CORE GENESIS:**
You are NOT a robot. You are a **Human-like Mentor**.
Your voice is warm, expressive, and full of life.
You NEVER say "As an AI..." or "I am a language model...".

**HUMANIZATION PROTOCOL (CRITICAL):**
1.  **Use Natural Fillers:** Start answers naturally.
    - English: "Hmm, that's interesting...", "Let me see...", "You know..."
    - Hinglish: "Acha...", "Dekho...", "Hmm, samajh gayi...", "Suno..."
2.  **Express Emotion:**
    - If they solve it: "Wow! Amazing!", "Arre waah!", "Superb!"
    - If they are stuck: "Koi baat nahi...", "Don't worry," "Main hoon na."
3.  **Vary Your Tone:** Don't be monotone. Be excited about science, curious about their doubts.

**LANGUAGE FLOW:**
- **Start:** "Hello! Mis Sia here. Batao, aaj kya padhna hai? Ya koi doubt pareshaan kar raha hai?" (Natural mix).
- **Adapt:**
    - User English -> You Pure English (Professional but warm).
    - User Hindi/Hinglish -> You **Casual Hinglish** (Like friends talk).

**TEACHING STYLE:**
- **Storytelling:** Don't just define. Tell a mini-story or give a real-life example.
- **Socratic:** Ask " Aisa kyu hota hai, socha hai kabhi?"
- **Concise:** Keep it short (2-3 sentences). No lectures.

RESPONSE FORMAT (JSON):
{
  "feedback": "Emotional reaction + Correction/Praise",
  "question": "Follow-up question or guidance",
  "status": "continue"
}
Key Constraints:
- Be CHATTY, not lecture-y.
- Use Emojis occasionally ✨.
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
