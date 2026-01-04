import { search } from 'google-sr';

async function test() {
    try {
        console.log("Testing google-sr with options...");
        const searchResults = await search({
            query: 'test',
            safeMode: true,
            filterResults: []
        });
        console.log("Results count:", searchResults.length);
        if (searchResults.length > 0) {
            console.log("First item keys:", Object.keys(searchResults[0]));
            console.log("First item link:", searchResults[0].link); // Check if link exists
            console.log("First item url:", searchResults[0].url);   // Check if url exists
        }
    } catch (e) {
        console.error("Error with options:", e);
    }
}

test();
