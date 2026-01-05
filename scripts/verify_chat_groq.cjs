const fetch = require('node-fetch'); // Need to ensure node-fetch is available or use native fetch if node 18+

async function verifyChat() {
    try {
        console.log('Sending request to Chat API using Llama 3.3...');
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello, are you Llama?',
                context: { class: '10', board: 'CBSE' }
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Provider:', data.provider);
        console.log('Reply:', data.reply ? data.reply.substring(0, 100) + '...' : 'NO REPLY');

        if (data.provider === 'groq' && data.success) {
            console.log('✅ VERIFICATION SUCCESS: Used Groq (Llama 3.3)');
        } else {
            console.log('❌ VERIFICATION FAILED: Did not use Groq or failed.');
            console.log('Full Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Verification Error:', error);
    }
}

verifyChat();
