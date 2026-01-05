const fetch = require('node-fetch');

async function testAgentRequest(message) {
    console.log(`\n\n--- Testing Message: "${message}" ---`);
    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                history: [],
                context: { class: '10', board: 'CBSE' } // Mock context
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        // The API might return a stream or JSON depending on internal logic, 
        // but for now our agent implementation returns JSON when using Groq + Tools.
        // If it starts streaming, this test might need adjustment, but let's see.

        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (contentType && contentType.includes('text/event-stream')) {
            console.log('Response is a stream. Reading chunks...');
            const reader = response.body;
            // Node-fetch body is a stream

            response.body.on('data', (chunk) => {
                const text = chunk.toString();
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            console.log('[Stream Done]');
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.status) console.log(`[STATUS] ${parsed.status}`);
                            if (parsed.text) process.stdout.write(parsed.text); // Print text inline
                            if (parsed.images) console.log(`\n[IMAGES] Found ${parsed.images.length}`);
                        } catch (e) { }
                    }
                }
            });

            // Wait for stream to end (simple timeout for script)
            await new Promise(r => setTimeout(r, 15000));
            console.log('\n--- End of Message ---');

        } else if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            // ... legacy handling ...
            console.log('Legacy JSON Response:', data);
        }
    } catch (e) {
        console.error('Request Failed:', e.message);
    }
}

async function runTests() {
    await testAgentRequest('Show me a diagram of the human heart');
    await testAgentRequest('Who is the current Education Minister of India?');
}

runTests();
