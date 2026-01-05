require('dotenv').config({ path: '.env.local' });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.log(`Checking Groq Key: ${GROQ_API_KEY ? 'Present' : 'Missing'}`);
if (GROQ_API_KEY) {
    console.log(`Key First 4 chars: ${GROQ_API_KEY.substring(0, 4)}`);
}

async function testGroq() {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Groq Failed: ${response.status} - ${text}`);
        } else {
            const data = await response.json();
            console.log("Groq Success:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testGroq();
