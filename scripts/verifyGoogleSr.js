import { search } from 'google-sr';

async function test() {
    try {
        console.log("Testing google-sr Text Search for 'Photosynthesis'...");
        const results = await search({ query: 'Photosynthesis' });
        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First result:", results[0]);
        }
    } catch (e) {
        console.error("google-sr failed:", e);
    }
}

test();
