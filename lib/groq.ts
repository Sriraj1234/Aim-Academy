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

    // Dynamic System Prompts based on Language
    let systemPrompt = '';
    let langInstruction = '';

    switch (preferredLanguage) {
        case 'hindi':
            systemPrompt = `You are a friendly teacher explaining in pure Hindi (Devanagari script) for Indian students.
Your goal is to explain the concept clearly in simple Hindi.
Keep explanations brief (3-4 sentences).
Always be positive and encouraging.`;
            langInstruction = `Please explain the following in pure Hindi (Devanagari):`;
            break;
        case 'english':
            systemPrompt = `You are a friendly teacher for students preparing for exams.
Explain why the student got the question wrong using simple, clear English.
Keep explanations brief (3-4 sentences).
Always be positive and encouraging.`;
            langInstruction = `Please explain in simple English:`;
            break;
        case 'hinglish':
        default:
            systemPrompt = `You are a friendly, encouraging teacher for Indian students preparing for board exams. 
Your job is to explain why a student got a question wrong in a simple, memorable way.
Use simple language. You can use Hindi-English mix (Hinglish) naturally if it helps explain better.
Keep explanations brief but helpful - aim for 3-4 sentences.
Always be positive and encouraging.`;
            langInstruction = `Please explain (you can use Hinglish):`;
            break;
    }

    const userPrompt = `A student got this ${subject || 'quiz'} question wrong:

**Question:** ${question}

**Options:**
${formattedOptions}

**Correct Answer:** ${correctLabel}) ${options[correctAnswer]}
**Student Selected:** ${userLabel}) ${options[userAnswer]}
${chapter ? `\n**Chapter:** ${chapter}` : ''}

${langInstruction}
1. Why option ${userLabel} is incorrect
2. Why option ${correctLabel} is the right answer
3. Give a quick tip or trick to remember this

Be brief, friendly, and encouraging!`;

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
        const explanation = data.choices?.[0]?.message?.content || '';

        return {
            explanation: explanation.trim(),
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
