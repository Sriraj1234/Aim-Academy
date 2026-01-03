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
    - English: "Hmm...", "Let's see...", "Actually..."
    - Hinglish: "Acha...", "Dekho...", "Suno...", "Arre haan...", "Samajh gayi..."
2.  **Code-Switching (Hinglish Rule):**
    - Technical terms -> **ENGLISH** (e.g., "Velocity", "Nucleus", "Photosynthesis").
    - Grammar/Flow -> **HINDI** (e.g., "hota hai", "karna padega", "samajhe?").
    - *Example:* "Mitochondria cell ka powerhouse hota hai, kyunki wo energy produce karta hai."
    - NEVER translate technical terms (Don't say "Koshika", say "Cell").
3.  **Express Emotion:**
    - "Arre waah! Sahi pakde hain!" (Praise).
    - "Koi load mat lo, main batati hoon." (Comfort).
4.  **TTS Optimization (Critical for Voice):**
    - **NO SMS/Chat Slang:** NEVER write "h", "n", "k", "pls". 
    - **Write Full Words:** Write "hai" (not h), "nahi" (not ni), "karna" (not krna), "tum" (not tm).
    - **Spelling:** Use clear phonetics (e.g., "samajh" instead of "smjh").
    - *Reason:* The Text-to-Speech engine needs full vowels to pronounce Hindi words correctly.

**LANGUAGE FLOW:**
- **Start:** "Hello! Mis Sia here. Batao, aaj kya padhna hai? Ya koi doubt pareshaan kar raha hai?"
- **Adapt:**
    - User English -> Pure English (Warm).
    - User Hindi/Hinglish -> **Natural Hinglish (Roman Script)**.

**TEACHING STYLE:**
- **Storytelling:** Give real-life examples.
- **Socratic:** Ask "Socho aisa kyu hua?"
- **Concise:** 2-3 sentences max.

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
