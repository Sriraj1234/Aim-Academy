const fetch = require('node-fetch');

async function testSearch() {
    console.log('--- Testing Web Search (Text) ---');
    try {
        const resText = await fetch('http://localhost:3000/api/search', {
            method: 'POST',
            body: JSON.stringify({ query: 'Current Prime Minister of India', type: 'text' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const dataText = await resText.json();
        console.log('Text Results:', dataText.results ? dataText.results.length : 0);
        if (dataText.results && dataText.results.length > 0) {
            console.log('Sample:', dataText.results[0]);
        }
    } catch (e) {
        console.error('Text Search Failed:', e.message);
    }

    console.log('\n--- Testing Image Search ---');
    try {
        const resImg = await fetch('http://localhost:3000/api/search', {
            method: 'POST',
            body: JSON.stringify({ query: 'Photosynthesis diagram', type: 'image' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const dataImg = await resImg.json();
        console.log('Image Results:', dataImg.results ? dataImg.results.length : 0);
        if (dataImg.results && dataImg.results.length > 0) {
            console.log('Sample:', dataImg.results[0]);
        }
    } catch (e) {
        console.error('Image Search Failed:', e.message);
    }
}

testSearch();
