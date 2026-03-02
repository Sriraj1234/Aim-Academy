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
import { getGroqChatCompletion, getGroqChatStream } from '@/lib/groq';
import { performWebSearch, performImageSearch } from '@/lib/search';
import { syllabusData } from '@/data/syllabusData';

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
        const chapterSummary = '';

        const board = (body.context?.board || 'cbse').toLowerCase();
        const classNum = (body.context?.class || '10').toString();

        // Use Local Syllabus Data ONLY for Class 10 (as it's hardcoded for it)
        if (classNum === '10' && syllabusData && syllabusData.length > 0) {
            const subjectsList = syllabusData.map(s => s.name).join(', ');
            syllabusInfo = `\n\n**OFFICIAL CLASS 10 BIHAR BOARD SYLLABUS:**\nSubjects: ${subjectsList}`;

            const detailedChapters = syllabusData.map(sub => {
                const chapters = sub.chapters.map(c => c.title).join(', ');
                return `- **${sub.name}**: ${chapters}`;
            }).join('\n');

            syllabusInfo += `\n\n**DETAILED CHAPTER LIST:**\n${detailedChapters}`;
        } else {
            // Fallback to Firestore if local is empty (Legacy logic)
            try {
                const board = (body.context?.board || 'cbse').toLowerCase();
                const classNum = body.context?.class || '10';
                const taxonomyKey = `${board}_${classNum}`;

                const taxDoc = await adminDb.collection('metadata').doc('taxonomy').get();
                if (taxDoc.exists) {
                    const taxonomy = taxDoc.data();
                    const firestoreData = taxonomy?.[taxonomyKey];

                    if (firestoreData?.subjects) {
                        syllabusInfo = `\n\n**Available Subjects:**\n${firestoreData.subjects.join(', ')}`;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch taxonomy:', err);
            }

            // Append Web Search instruction for non-local classes
            syllabusInfo += `\n\n**NOTE:** Detailed syllabus for Class ${classNum} is not locally cached. If the user asks about specific chapters or topics, **use your WEB_SEARCH tool** to find the latest ${board.toUpperCase()} Class ${classNum} syllabus details.`;
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

        // Strict Syllabus Instruction
        if (syllabusInfo) {
            contextInfo += `\n\n**SYLLABUS CONSTRAINT:**\nOnly answer questions relevant to the User's Class ${userClass} ${userBoard} Syllabus. If a topic is clearly out of syllabus (e.g., Calculus for Class 10), politely inform the student but still provide a brief simplified overview.`;
        }

        contextInfo += syllabusInfo + chapterSummary;

        const siteKnowledge = `\n\n**WEBSITE KNOWLEDGE (Use this to guide the student):**
- **AI Chat Buddy**: That's you! You now have "Short Term Memory" (I remember our last few chats in this session) and I can search the web/images for you.
- **Live Quizzes**: Real-time competitions. Look for the "Live Quiz" banner on the home page.
- **Battle Mode**: Multiplayer quiz game to challenge friends.
- **Study Hub**: 3D Models, Explainer Videos, and Concept maps.
- **Notes**: Chapter-wise PDF notes.
- **AI Flashcards**: Create instant flashcards for any topic.
- **Mind Games**: Brain-training mini-games.
`;

        contextInfo += siteKnowledge;

        contextInfo += `\n\n**Syllabus Check**: If asked about subjects/chapters, verify with the syllabus list provided above.`;


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
                                content: `You are an Intent Classifier. Classify the user's latest message into ONE of these categories:

- "WEB_SEARCH": Use this when the user asks about:
  * Current/live data: prices (gold, petrol, crypto), exchange rates, weather
  * Current events, news, recent happenings
  * People currently in positions ("Who is PM", "current CEO of")
  * Dates of upcoming events (exams, elections, matches)
  * "Aaj", "today", "latest", "abhi", "current", "live", "kitna hai" (real-world queries)
  * Sports scores, movie releases, stock market, election results
  * Any question where the answer changes day to day

- "IMAGE_SEARCH": Use this when:
  1. User directly asks for visual ("Show me", "Diagram of", "Image of")
  2. Topic is naturally visual (Biology organs, Chemical structures, Physics setups, Maps, Geometry)
  Rule: If user asks "What is X?" and X is a PHYSICAL OBJECT (Heart, Prism, Volcano, Circuit, Cell), choose IMAGE_SEARCH.

- "CHAT": For general conversation, math derivations, theoretical concepts, opinions, or anything that does not need live data or images.

Respond ONLY with: WEB_SEARCH, IMAGE_SEARCH, or CHAT`
                            },
                            ...(body.history || []).slice(-2).map(m => ({
                                role: m.role === 'model' ? 'assistant' : m.role,
                                content: m.content
                            })),
                            { role: 'user', content: body.message }
                        ];

                        const intentCheck = await getGroqChatCompletion(intentMessages, 0.1, 10, 'llama-3.3-70b-versatile');
                        const intent = intentCheck.reply.trim().toUpperCase();

                        // 2. Execute Tools
                        // Enhanced regex for biology/visual topics
                        const visualKeywords = /image|photo|diagram|sketch|map|structure|anatomy|cycle|mechanism|graph|figure|draw|show|look like|cell|heart|brain|eye|ear|plant|flower|leaf|root|skeleton|skull|liver|kidney|lung|prism|lens|mirror|magnet|circuit|solar system|planet|atom|molecule|volcano|mountain|river|glacier/i;

                        if (intent.includes('IMAGE') || body.message.match(visualKeywords)) {
                            sendEvent({ status: 'searching_image' });

                            // If implicit (no "show me"), use the full message as query but clean it slightly
                            let query = body.message.replace(/show|me|images?|photos?|diagrams?|sketches?/gi, '').trim();

                            // For specific biology/science topics, make query specific to find better diagrams
                            if (query.match(/cockroach|digestive|heart|brain|flower|plant|anatomy|cell|kidney|liver|lung|eye|ear|skeleton/i)) {
                                query += " scientific diagram";
                            }
                            // Physics/Geography diagrams
                            if (query.match(/prism|lens|mirror|circuit|solar system|atom|molecule|volcano/i)) {
                                query += " diagram";
                            }

                            toolImages = await performImageSearch(query);
                            if (toolImages.length > 0) {
                                toolResults += `\n[SYSTEM: Found ${toolImages.length} images for "${query}". Refer to them in your explanation.]`;
                                sendEvent({ images: toolImages });
                            }
                        }

                        else if (intent.includes('WEB') || body.message.match(/current|latest|news|today|aaj|abhi|price|kitna|kya hai|gold|petrol|crude|crypto|bitcoin|rate|rupee|dollar|rupaya|share|stock|sensex|nifty|match score|ipl|world cup|election|result|who is|pm |cm |minister|exam date|admit card|syllabus 2025|cutoff|weather|temperature|breaking|live update|search|find out/i)) {
                            sendEvent({ status: 'searching_web' });
                            // Clean up the query
                            const query = body.message
                                .replace(/search karke bata|search karo|google karo|dhundho|batao|bata do|mujhe bata|kya hai aaj/gi, '')
                                .replace(/aaj ka|aaj ki|aaj ke/gi, 'today')
                                .trim();
                            const searchResults = await performWebSearch(query);
                            const searchDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

                            if (searchResults.length > 0) {
                                const snippets = searchResults.map((r: any, i: number) =>
                                    `${i + 1}. **${r.title}**\n   ${r.description}\n   🔗 Source: ${r.source}${r.url ? ` (${r.url})` : ''}`
                                ).join('\n\n');
                                toolResults += `\n\n[SYSTEM: 🔍 Web Search Results for "${query}" — searched on ${searchDate}:\n\n${snippets}\n\nINSTRUCTION: Use the above verified real-time data to answer. Follow the WEB SEARCH ANSWER FORMAT from your instructions: use emojis, bullet points, and tables. Cite the source at the end. Do NOT say you lack real-time access.]`;
                            } else {
                                toolResults += `\n\n[SYSTEM: Web search returned no results for "${query}" (${searchDate}). Answer using your best knowledge. Mention the search date context and advise user to verify on official sources like RBI, MCX, or official government portals.]`;
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

                        try {
                            const streamGenerator = getGroqChatStream(groqMessages, 0.7, 1024, 'llama-3.3-70b-versatile');
                            for await (const chunk of streamGenerator) {
                                sendEvent({ text: chunk });
                            }
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                            controller.close();
                            return;
                        } catch (groqError: any) {
                            console.error('Groq Streaming Failed:', groqError);
                            sendEvent({ debug_error: `Groq Failed: ${groqError.message}` });
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
