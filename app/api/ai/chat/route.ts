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
import { adminDb } from '@/lib/firebase-admin';
import { getGroqChatCompletion } from '@/lib/groq';
import { performWebSearch, performImageSearch } from '@/lib/search';

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

        // --- Fetch Syllabus Context ---
        let syllabusInfo = '';
        let subjects: string[] = [];
        let chapterSummary = '';

        try {
            const board = (body.context?.board || 'cbse').toLowerCase();
            const classNum = body.context?.class || '10';
            const taxonomyKey = `${board}_${classNum}`;

            const taxDoc = await adminDb.collection('metadata').doc('taxonomy').get();
            if (taxDoc.exists) {
                const taxonomy = taxDoc.data();
                const syllabusData = taxonomy?.[taxonomyKey];

                if (syllabusData?.subjects) {
                    subjects = syllabusData.subjects;
                    syllabusInfo = `\n\n**Available Subjects in Your ${body.context?.board?.toUpperCase() || 'CBSE'} Class ${classNum} Syllabus:**\n${subjects.join(', ')}`;

                    // Build detailed chapter list for "Full Syllabus Knowledge"
                    if (syllabusData.chapters) {
                        const allChapters = subjects.map(sub => {
                            const chapters = syllabusData.chapters[sub] || [];
                            // Format: "Physics: Light, Human Eye, Electricity..."
                            return `**${sub}**: ${chapters.join(', ')}`;
                        }).join('\n');

                        chapterSummary = `\n\n**FULL SYLLABUS (Reference This):**\n${allChapters}`;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch taxonomy:', err);
        }

        // --- Build System Context ---
        const userName = body.context?.name || 'Student';
        const userClass = body.context?.class || '10';
        const userBoard = body.context?.board?.toUpperCase() || 'CBSE';
        const userStream = body.context?.stream;

        let contextInfo = `\n\n**User Profile:**
- Name: ${userName}
- Class: ${userClass} (${userBoard} Board)${userStream ? `\n- Stream: ${userStream}` : ''}`;

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


        // ----------------------------------------------------
        // STREAMING RESPONSE HANDLER 
        // ----------------------------------------------------
        // We always use streaming to provide "Status Updates" (Search Icon, etc.)

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Helper to send events
                    const sendEvent = (data: any) => {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                    }

                    // ----------------------------------------------------
                    // AGENTIC FLOW: Intent Detection & Tool Execution
                    // ----------------------------------------------------

                    let toolResults = '';
                    let toolImages: any[] = [];

                    if (!body.image) {
                        // 1. Detect Intent
                        const intentMessages: any[] = [
                            {
                                role: 'system',
                                content: `You are an Intent Classifier. Your job is to classify the user's latest message into one of these categories:
- "WEB_SEARCH": If the user is asking for current events, factual data, syllabus info, or dynamic content.
- "IMAGE_SEARCH": If the user explicitly asks for images OR if the topic is highly visual (e.g., Biology diagrams, Anatomy, Chemical Structures, Physics setups) where an image would help understanding. Example: "Explain Cockroach anatomy", "Photosynthesis process".
- "CHAT": For general conversation, coding help, or explaining non-visual concepts.

Respond ONLY with the category value.`
                            },
                            ...(body.history || []).slice(-2).map(m => ({
                                role: m.role === 'model' ? 'assistant' : m.role,
                                content: m.content
                            })),
                            { role: 'user', content: body.message }
                        ];

                        const intentCheck = await getGroqChatCompletion(intentMessages, 0.1, 10);
                        const intent = intentCheck.reply.trim().toUpperCase();

                        // 2. Execute Tools
                        // Enhanced regex for biology/visual topics
                        const visualKeywords = /image|photo|diagram|sketch|map|structure|anatomy|cycle|mechanism/i;

                        if (intent.includes('IMAGE') || body.message.match(visualKeywords)) {
                            sendEvent({ status: 'searching_image' });

                            // If implicit (no "show me"), use the full message as query but clean it slightly
                            let query = body.message.replace(/show|me|images?|photos?|diagrams?|sketches?/gi, '').trim();

                            // For specific biology topics, make query specific to find better diagrams
                            if (query.match(/cockroach|digestive|heart|brain|flower|plant|anatomy|cell/i)) {
                                query += " scientific diagram";
                            }

                            toolImages = await performImageSearch(query);
                            if (toolImages.length > 0) {
                                toolResults += `\n[SYSTEM: Found ${toolImages.length} images for "${query}". Refer to them.]`;
                                sendEvent({ images: toolImages });
                            }
                        }

                        else if (intent.includes('WEB') || body.message.match(/current|latest|news|who is|price|date/i)) {
                            sendEvent({ status: 'searching_web' });
                            const query = body.message.replace(/search|find|google|about/gi, '').trim();
                            const searchResults = await performWebSearch(query);

                            if (searchResults.length > 0) {
                                const snippets = searchResults.map((r: any) => `- ${r.title}: ${r.description} (Source: ${r.source})`).join('\n');
                                toolResults += `\n[SYSTEM: Web Results for "${query}":\n${snippets}\nUse this verified info.]`;
                            } else {
                                toolResults += `\n[SYSTEM: Search returned nothing.]`;
                            }
                        }
                    }

                    // ----------------------------------------------------
                    // GENERATE RESPONSE (Groq Llama 3.3)
                    // ----------------------------------------------------
                    sendEvent({ status: 'thinking' });

                    if (!body.image) {
                        const systemPrompt = AIM_BUDDY_INSTRUCTION + (contextInfo ? `\n\n${contextInfo}` : '') + toolResults;

                        const groqMessages: any[] = [
                            { role: 'system', content: systemPrompt },
                            ...(body.history || []).slice(-6).map(m => ({
                                role: m.role === 'model' ? 'assistant' : m.role,
                                content: m.content
                            })),
                            { role: 'user', content: body.message }
                        ];

                        const groqResult = await getGroqChatCompletion(groqMessages);

                        if (groqResult.success && groqResult.reply) {
                            sendEvent({ text: groqResult.reply });
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                            controller.close();
                            return;
                        } else {
                            sendEvent({ debug_error: `Groq Failed: ${groqResult.error}` });
                        }
                    }

                    // ----------------------------------------------------
                    // FALLBACK: Gemini (Multimodal or Error)
                    // ----------------------------------------------------
                    if (isGeminiConfigured()) {
                        const model = body.image ? getMultimodalModel() : getTextModel();
                        const prompt = contextInfo ? `${contextInfo}\n\n${body.message}` : body.message;

                        if (body.image) {
                            sendEvent({ status: 'analyzing_image' });
                            const result = await model.generateContent([
                                prompt,
                                { inlineData: { data: body.image.base64, mimeType: body.image.mimeType || 'image/jpeg' } }
                            ]);
                            const text = result.response.text();
                            sendEvent({ text });
                        } else {
                            // Fallback Chat
                            const chat = model.startChat({
                                history: (body.history || []).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
                            });
                            const result = await chat.sendMessageStream(prompt);
                            for await (const chunk of result.stream) {
                                const text = chunk.text();
                                if (text) sendEvent({ text });
                            }
                        }
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                        return;
                    }

                    sendEvent({ error: 'All AI services failed.' });
                    controller.close();

                } catch (error: any) {
                    console.error('Stream Error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
                    controller.close();
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

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Something went wrong' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
