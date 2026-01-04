import googleIt from 'google-it';

async function test() {
    try {
        console.log("Testing google-it for 'Photosynthesis'...");
        const results = await googleIt({ 'query': 'Photosynthesis', disableConsole: true });
        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First Result:", results[0]);
        }
    } catch (e) {
        console.error("google-it failed:", e);
    }
}

test();
