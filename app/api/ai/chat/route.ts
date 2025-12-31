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

        // Build context info
        // Build context info with Profile Data
        let contextInfo = `Student Profile: ${body.context?.name ? 'Name: ' + body.context.name + ', ' : ''}Class ${body.context?.class || 'Unknown'}, Board: ${body.context?.board || 'General'}`;
        if (body.context?.stream) contextInfo += `, Stream: ${body.context.stream}`;
        if (body.context?.subject) contextInfo += `\nCurrent Subject: ${body.context.subject}`;
        if (body.context?.chapter) contextInfo += `\nCurrent Chapter: ${body.context.chapter}`;

        // Add User Preference for Format: Short & Chunked
        contextInfo += `\n\nIMPORTANT FORMATTING RULE: Break long answers into short, readable parts (bullet points or short paragraphs). Adapt the difficulty level strictly to Class ${body.context?.class || '10'}.`;

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
