
const fetch = require('node-fetch');

async function testApi() {
    try {
        console.log('Testing /api/ai/analyze...');
        const res1 = await fetch('http://localhost:3000/api/ai/analyze', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
        console.log(`POST /api/ai/analyze: ${res1.status}`);
        if (res1.status === 200) {
            const json = await res1.json();
            console.log('Response:', json);
        } else {
            const text = await res1.text();
            console.log('Error text preview:', text.substring(0, 100));
        }

        console.log('\nTesting /api/referral/credit...');
        const res2 = await fetch('http://localhost:3000/api/referral/credit', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
        console.log(`POST /api/referral/credit: ${res2.status}`);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testApi();
