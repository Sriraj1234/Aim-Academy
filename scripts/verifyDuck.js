import { search } from 'duck-duck-scrape';

async function test() {
    try {
        console.log("Testing DuckDuckGo Text Search for 'Photosynthesis'...");
        const textResults = await search('Photosynthesis');
        console.log("Text Results:", textResults.results?.length || 0);
        if (textResults.results?.length > 0) {
            console.log("First Text Result:", textResults.results[0]);
        }

        console.log("\nTesting DuckDuckGo Image Search for 'Photosynthesis diagram'...");
        // searchType: 'image' or 1?? Usually 'image' works in wrappers, or we check the docs through trial
        // duck-duck-scrape uses 'images' or 'image' usually.
        // Let's try to inspect the library behavior or just try validation.

        try {
            // Try explicit import if it exists, otherwise use search option
            // Based on common knowledge of this package
            const imageResults = await search('Photosynthesis diagram', {
                searchType: 'image'
            });

            console.log("Image Results:", imageResults.results?.length || 0);
            if (imageResults.results?.length > 0) {
                console.log("First Image Result:", imageResults.results[0]);
            }
        } catch (imgErr) {
            console.error("Image search specific error:", imgErr);
        }

    } catch (e) {
        console.error("DuckDuckGo failed with error:");
        console.error(e.message);
        console.error(e.stack);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
}

test();
