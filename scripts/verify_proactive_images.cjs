const fetch = require('node-fetch');

async function testAgentRequest(message) {
    console.log(`\n\n--- Testing Message: "${message}" ---`);
    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                history: [],
                context: { class: '10', board: 'CBSE' }
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/event-stream')) {
            console.log('Response is a stream. Reading chunks...');
            response.body.on('data', (chunk) => {
                const text = chunk.toString();
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.status) console.log(`[STATUS] ${parsed.status}`);
                            if (parsed.images) console.log(`\n[IMAGES] Found ${parsed.images.length}`);
                        } catch (e) { }
                    }
                }
            });
            await new Promise(r => setTimeout(r, 10000));
        }
    } catch (e) {
        console.error('Request Failed:', e.message);
    }
}

async function runTests() {
    await testAgentRequest('Explain Photosynthesis process');
    await testAgentRequest('Cockroach anatomy details');
    await testAgentRequest('What is the capital of France?'); // Should NOT show images usually, or maybe Web Search
}

runTests();
