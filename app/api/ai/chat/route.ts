/**
 * Gemini AI Chat API with Streaming Support
 * 
 * This endpoint handles:
 * - Text chat with conversation history
 * - Streaming responses for real-time UI
 * - Multimodal input (images)
 * - Falls back to Groq if Gemini is unavailable
 */

import { NextRequest } from 'next/server';
import {
    isGeminiConfigured,
    getTextModel,
    getMultimodalModel,
    AIM_BUDDY_INSTRUCTION
} from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Fallback to Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface ChatMessage {
    role: 'user' | 'assistant' | 'model';
    content: string;
}

interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    context?: {
        subject?: string;
        chapter?: string;
        class?: string;
        board?: string;
        stream?: string;
        name?: string;
    };
    image?: {
        base64: string;
        mimeType: string;
    };
    stream?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();

        if (!body.message?.trim() && !body.image) {
            return new Response(
                JSON.stringify({ success: false, error: 'Message is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if streaming is requested
        const wantStream = body.stream === true;

        // --- NEW: Fetch Syllabus Data ---
        let syllabusInfo = '';
        let subjects: string[] = [];
        let chapterSummary = '';

        try {
            const board = (body.context?.board || 'cbse').toLowerCase();
            const classNum = body.context?.class || '10';
            const taxonomyKey = `${board}_${classNum}`;

            const taxDoc = await getDoc(doc(db, 'metadata', 'taxonomy'));
            if (taxDoc.exists()) {
                const taxonomy = taxDoc.data();
                const syllabusData = taxonomy?.[taxonomyKey];

                if (syllabusData?.subjects) {
                    subjects = syllabusData.subjects;
                    syllabusInfo = `\n\n**Available Subjects in Your ${body.context?.board?.toUpperCase() || 'CBSE'} Class ${classNum} Syllabus:**\n${subjects.join(', ')}`;

                    // Build chapter summary (limited to avoid token overflow)
                    if (syllabusData.chapters) {
                        const chapterList = subjects.slice(0, 5).map(sub => {
                            const chapters = syllabusData.chapters[sub] || [];
                            const count = chapters.length;
                            return `- ${sub}: ${count} chapters`;
                        }).join('\n');
                        chapterSummary = `\n\n**Chapter Counts:**\n${chapterList}`;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch taxonomy:', err);
            // Continue without syllabus data
        }

        // --- Enhanced Context with Personalization ---
        const userName = body.context?.name || 'Student';
        const userClass = body.context?.class || '10';
        const userBoard = body.context?.board?.toUpperCase() || 'CBSE';
        const userStream = body.context?.stream;

        let contextInfo = `**Student Profile:**
- Name: ${userName}
- Board: ${userBoard}
- Class: ${userClass}${userStream ? `\n- Stream: ${userStream}` : ''}`;

        if (body.context?.subject) contextInfo += `\n- Current Subject: ${body.context.subject}`;
        if (body.context?.chapter) contextInfo += `\n- Current Chapter: ${body.context.chapter}`;

        contextInfo += syllabusInfo + chapterSummary;

        contextInfo += `\n\n**Personality & Style:**
- Greet by name when user says hi/hello/hai/namaste
- Respond naturally in Hinglish (mix of English & Hindi)
- Use emojis for warmth 📚✨
- Be encouraging like a senior student
- If asked about subjects/chapters, refer to the EXACT syllabus list above`;

        contextInfo += `\n\n**FORMATTING RULE:** Break long answers into short, readable parts (bullet points or short paragraphs). Adapt difficulty to Class ${userClass}.`;

        // Try Gemini first
        if (isGeminiConfigured()) {
            try {
                // Convert history format for Gemini
                const geminiHistory = (body.history || []).map(msg => ({
                    role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
                    parts: [{ text: msg.content }]
                }));

                // Handle multimodal (image) input
                if (body.image) {
                    const model = getMultimodalModel();
                    const prompt = contextInfo
                        ? `${contextInfo}\n\nUser's question about this image: ${body.message || 'Please explain this image'}`
                        : body.message || 'Please explain this image';

                    const result = await model.generateContent([
                        prompt,
                        {
                            inlineData: {
                                data: body.image.base64,
                                mimeType: body.image.mimeType || 'image/jpeg',
                            },
                        },
                    ]);

                    const reply = result.response.text();
                    return new Response(
                        JSON.stringify({ success: true, reply, provider: 'gemini' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                }

                // Text-only chat
                const model = getTextModel();

                // Add context to the first message if available
                const userMessage = contextInfo
                    ? `${contextInfo}\n\n${body.message}`
                    : body.message;

                if (wantStream) {
                    // Streaming response
                    const chat = model.startChat({ history: geminiHistory });
                    const result = await chat.sendMessageStream(userMessage);

                    const encoder = new TextEncoder();
                    const stream = new ReadableStream({
                        async start(controller) {
                            try {
                                for await (const chunk of result.stream) {
                                    const text = chunk.text();
                                    if (text) {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                                    }
                                }
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                controller.close();
                            } catch (error) {
                                controller.error(error);
                            }
                        }
                    });

                    return new Response(stream, {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                        },
                    });
                } else {
                    // Non-streaming response
                    const chat = model.startChat({ history: geminiHistory });
                    const result = await chat.sendMessage(userMessage);
                    const reply = result.response.text();

                    return new Response(
                        JSON.stringify({ success: true, reply, provider: 'gemini' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                }
            } catch (geminiError) {
                console.error('Gemini error, falling back to Groq:', geminiError);
                // Fall through to Groq
            }
        }

        // Fallback to Groq
        if (!GROQ_API_KEY) {
            return new Response(
                JSON.stringify({ success: false, error: 'AI service not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const systemPrompt = AIM_BUDDY_INSTRUCTION + (contextInfo ? `\n\n${contextInfo}` : '');

        const messages = [
            { role: 'system', content: systemPrompt },
            ...(body.history || []).slice(-6).map(m => ({
                role: m.role === 'model' ? 'assistant' : m.role,
                content: m.content
            })),
            { role: 'user', content: body.message }
        ];

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.7,
                max_tokens: 400,
            }),
        });

        if (!response.ok) {
            return new Response(
                JSON.stringify({ success: false, error: 'AI is busy, please try again' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';

        return new Response(
            JSON.stringify({ success: true, reply: reply.trim(), provider: 'groq' }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Something went wrong' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
