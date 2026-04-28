// Groq AI Service Utility
// Using Groq's ultra-fast LPU for AI explanations

// GROQ_API_KEY will be read from process.env inside functions
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ExplanationRequest {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    subject?: string;
    chapter?: string;
    preferredLanguage?: 'english' | 'hindi' | 'hinglish';
}

export interface ExplanationResponse {
    explanation: string;
    tip?: string;
    success: boolean;
    error?: string;
}

export async function getAIExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return {
            explanation: '',
            success: false,
            error: 'API key not configured'
        };
    }

    const { question, options, correctAnswer, userAnswer, subject, chapter, preferredLanguage = 'hinglish' } = request;

    // Create option labels
    const optionLabels = ['A', 'B', 'C', 'D'];
    const formattedOptions = options.map((opt, i) => `${optionLabels[i]}) ${opt}`).join('\n');
    const correctLabel = optionLabels[correctAnswer];
    const userLabel = optionLabels[userAnswer];

    const isHindi = preferredLanguage === 'hindi';

    const systemPrompt = `You are an expert tutor for Indian students preparing for BSEB Bihar Board Class 10 & 12 exams.
A student answered a question incorrectly. Your job is to explain clearly why they were wrong and what the correct reasoning is.

Respond ONLY with a valid JSON object — no markdown fences, no extra text. Use this exact structure:
{
  "concept": "1-2 sentence explanation of the core concept tested in this question",
  "whyWrong": "Exactly why option ${userLabel} (the student's answer) is incorrect — be specific to the values/logic",
  "whyCorrect": "Step-by-step reason why option ${correctLabel} is the right answer — show the logic or formula",
  "trick": "A short, exam-ready memory trick or shortcut to never forget this again"
}

${isHindi
        ? 'Write ALL values in clear Hindi (Devanagari script). Use simple language suitable for a 15-year-old.'
        : 'Write in natural Hinglish (Hindi + English mix). Use Hindi for explanation, English for math/science terms.'
    }
Be encouraging, not critical. Assume the student is smart but made a small mistake.`;

    const userPrompt = `Subject: ${subject || 'General'}${chapter ? ` | Chapter: ${chapter}` : ''}

Question: ${question}

Options:
${formattedOptions}

Student selected: ${userLabel}) ${options[userAnswer]}
Correct answer: ${correctLabel}) ${options[correctAnswer]}

Explain why the student is wrong and the correct reasoning. Return ONLY the JSON object.`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Best quality model on Groq
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API error:', errorData);
            return {
                explanation: '',
                success: false,
                error: `API error: ${response.status}`
            };
        }

        const data = await response.json();
        const raw = (data.choices?.[0]?.message?.content || '').trim();

        // Try to parse structured JSON from AI response
        let sections: { concept?: string; whyWrong?: string; whyCorrect?: string; trick?: string } = {};
        try {
            // Strip markdown fences if present
            const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
            sections = JSON.parse(cleaned);
        } catch {
            // AI didn't return valid JSON — fall back to plain text
        }

        const hasStructure = !!(sections.concept || sections.whyWrong || sections.whyCorrect || sections.trick);

        return {
            explanation: hasStructure ? JSON.stringify(sections) : raw,
            tip: sections.trick,
            success: true
        };
    } catch (error) {
        console.error('Groq API call failed:', error);
        return {
            explanation: '',
            success: false,
            error: 'Failed to get explanation. Please try again.'
        };
    }

}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function getGroqChatCompletion(
    messages: ChatMessage[],
    temperature: number = 0.7,
    maxTokens: number = 1024,
    model: string = 'llama-3.3-70b-versatile'
): Promise<{ reply: string; success: boolean; error?: string }> {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        console.error("Groq Error: API key missing in getGroqChatCompletion");
        return { reply: '', success: false, error: 'API key not configured' };
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq Chat API error:', errorData);
            return {
                reply: '',
                success: false,
                error: `API error: ${response.status}`
            };
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';

        return {
            reply: reply.trim(),
            success: true
        };
    } catch (error) {
        console.error('Groq Chat execute failed:', error);
        return {
            reply: '',
            success: false,
            error: 'Failed to get chat response'
        };
    }
}

export async function* getGroqChatStream(
    messages: ChatMessage[],
    temperature: number = 0.7,
    maxTokens: number = 1024,
    model: string = 'llama-3.3-70b-versatile'
): AsyncGenerator<string, void, unknown> {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        console.error("Groq Error: API key missing in getGroqChatStream");
        throw new Error("API key not configured");
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages,
                temperature,
                max_tokens: maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq Stream API error:', errorData);
            throw new Error(`API error: ${response.status}`);
        }

        if (!response.body) {
            throw new Error("No response body returned from Groq stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                const data = trimmedLine.slice(6).trim();
                if (data === '[DONE]') break;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                } catch (e) {
                    // silently ignore malformed inner JSON
                }
            }
        }
    } catch (error) {
        console.error('Groq Stream execute failed:', error);
        throw error;
    }
}
