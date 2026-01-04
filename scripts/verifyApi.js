async function testApi() {
    const baseUrl = 'http://localhost:3000/api/search';

    console.log("--- Testing TEXT Search ---");
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Photosynthesis', type: 'text' })
        });

        console.log("Status:", res.status);
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log("Text Results Count:", data.results?.length);
            if (data.results?.length > 0) console.log("First Result:", data.results[0]);
            if (data.error) console.error("API Error Message:", data.error);
        } catch (e) {
            console.error("Failed to parse JSON:", text.substring(0, 200));
        }

    } catch (e) {
        console.error("Text Search Error:", e.message);
    }

    console.log("\n--- Testing IMAGE Search ---");
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Photosynthesis diagram', type: 'image' })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Image Results Count:", data.results?.length);
        if (data.results?.length > 0) console.log("First Image:", data.results[0]);
    } catch (e) {
        console.error("Image Search Error:", e.message);
    }
}

testApi();
