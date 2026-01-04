import { GOOGLE_IMG_SCRAP } from 'google-img-scrap';

async function test() {
    try {
        console.log("Testing Hack: Using Image Search for Text Results...");
        const result = await GOOGLE_IMG_SCRAP({
            search: "Photosynthesis",
            limit: 5,
            safeSearch: true,
            excludeDomains: ["stock.adobe.com", "shutterstock.com"]
        });

        if (result && result.result && result.result.length > 0) {
            console.log("Hack Success! Found", result.result.length, "results.");
            const snippets = result.result.map(r => ({
                title: r.title,
                description: "Visual result from " + (new URL(r.originalUrl).hostname), // Mock description
                url: r.originalUrl
            }));
            console.log("First Snippet:", snippets[0]);
        } else {
            console.log("Hack Failed: 0 results.");
        }
    } catch (e) {
        console.error("Hack failed:", e);
    }
}

test();
