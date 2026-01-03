import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Models to try in order of capability/preference (Verified Available)
const MODELS_TO_TRY = [
    'gemini-3-flash-preview', // Newest 
    'gemini-2.5-flash',       // Stable High-End
    'gemini-2.5-pro',         // High Reasoning
    'gemini-2.0-flash',       // Previous Gen Stable
    'gemini-2.5-flash-lite'   // Efficient Fallback
];

export async function POST(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('image') as File;
        const promptText = formData.get('prompt') as string || "Solve this problem step-by-step.";

        if (!file) {
            return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
        }

        // Convert File to Base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: file.type || 'image/jpeg',
            },
        };

        const systemInstruction = `
        You are an expert Math & Science Tutor for Indian students.
        1. Solve the problem in the image STEP-BY-STEP.
        2. Use LaTeX for math formulas (wrap in $ $ for inline, $$ $$ for block).
        3. Explain in a mix of English and simple Hindi (Hinglish) if helpful.
        4. Be kind and encouraging.
        `;

        let lastError = null;
        let successResult = null;
        let usedModel = '';

        // --- Multi-Model Fallback Loop ---
        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`Trying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([
                    systemInstruction + "\n\nUser Question: " + promptText,
                    imagePart
                ]);
                const response = await result.response;
                successResult = response.text();
                usedModel = modelName;
                break; // Success! Exit loop.

            } catch (err: any) {
                console.warn(`Model ${modelName} failed:`, err.message);
                lastError = err;
                // Continue to next model
            }
        }

        if (successResult) {
            return NextResponse.json({
                solution: successResult,
                modelUsed: usedModel
            });
        } else {
            throw lastError || new Error("All models failed to process the image.");
        }

    } catch (error: any) {
        console.error("Snap Solver Error:", error);
        return NextResponse.json({ error: error.message || "Failed to solve doubt" }, { status: 500 });
    }
}
