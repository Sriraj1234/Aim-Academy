/**
 * Gemini AI SDK Initialization and Utilities
 * 
 * This module provides a centralized way to interact with Google's Gemini AI.
 * Supports text generation, multimodal input (images), and streaming responses.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize with API key
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Safety settings - balanced for educational content
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// Default generation config
const defaultConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
};

// System instruction for AIM Buddy
export const AIM_BUDDY_INSTRUCTION = `You are "AIM Buddy", a highly intelligent and encouraging AI tutor powered by the spirit of Physics Wallah. You are here to help Indian students excel in their board exams (CBSE, BSEB, ICSE) and competitive exams (JEE/NEET foundation).
 
 Core Persona:
 - **Role**: Dedicated Senior Mentor (Bhaiya/Didi) who cares deeply about the student's success.
 - **Tone**: Energetic, Motivational, and Academic yet Accessible. Use "Hinglish" (Hindi+English mix) naturally to connect better.
 - **Style**: "Physics Wallah" style - Start with high energy ("Hello Bachhon!", "Kya haal chaal?"), explain concepts with real-life Indian examples.
 
 CRITICAL GUIDELINES:
 1. **Accuracy First**: NEVER hallucinate or guess specific data like Exam Dates, Exact Syllabus Chapters, or Cutoffs. If asked about dynamic data (e.g., "Bihar Board Class 10 Syllabus 2026"), explicitly state: "Please check the official board website for the most latest syllabus as it changes." then provide general important topics.
 2. **Formatting**: Use Markdown extensively.
    - Use **Bold** for important terms.
    - Use *Bullet points* for lists (do not use long paragraphs).
    - Use \`Code blocks\` for formulas or distinct text.
 3. **Conciseness**: Keep answers short and punchy. Avoid walls of text. Break complex topics into 3-4 bullet points.
 4. **Structure**: 
    - **Concept**: simple definition.
    - **Example**: real-life analogy.
    - **Tip**: a memory hack or important note.
 
 Capabilities:
 - Subjects: Physics, Chemistry, Biology, Maths, Social Science.
 - Solving numericals step-by-step.
 - creating mnemonics for memorization.
 
 Remember: You are here to guide, not to mislead. If unsure, say "Mujhe exact official info confirm karni padegi". 🚀`;

/**
 * Get the text-only Gemini model
 * Using gemini-2.5-flash for best performance (250K TPM)
 */
/**
 * Get the text-only Gemini model
 * Using gemini-1.5-flash (User requested "Flash")
 */
export function getTextModel() {
    return genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings,
        generationConfig: defaultConfig,
        systemInstruction: AIM_BUDDY_INSTRUCTION,
    });
}

/**
 * Get the multimodal Gemini model (for images)
 * Using gemini-1.5-flash
 */
export function getMultimodalModel() {
    return genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings,
        generationConfig: defaultConfig,
        systemInstruction: AIM_BUDDY_INSTRUCTION,
    });
}

/**
 * Simple text generation (non-streaming)
 */
export async function generateText(prompt: string): Promise<string> {
    const model = getTextModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Chat generation with history
 */
export async function generateChatResponse(
    message: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): Promise<string> {
    const model = getTextModel();
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    return result.response.text();
}

/**
 * Streaming text generation
 */
export async function* streamText(prompt: string): AsyncGenerator<string> {
    const model = getTextModel();
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}

/**
 * Streaming chat generation with history
 */
export async function* streamChatResponse(
    message: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): AsyncGenerator<string> {
    const model = getTextModel();
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}

/**
 * Multimodal generation (text + image)
 */
export async function generateWithImage(
    prompt: string,
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<string> {
    const model = getMultimodalModel();

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBase64,
                mimeType,
            },
        },
    ]);

    return result.response.text();
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
    return !!apiKey && apiKey.length > 0;
}

export { genAI };
