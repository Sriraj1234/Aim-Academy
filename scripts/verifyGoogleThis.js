import google from 'googlethis';

async function test() {
    try {
        console.log("Testing Text Search for 'Photosynthesis'...");
        const response = await google.search('Photosynthesis', { safe: true });
        console.log("Text Results:", response.results?.length || 0);
        if (response.results?.length > 0) {
            console.log(response.results[0]);
        }

        console.log("\nTesting Image Search for 'Photosynthesis diagram'...");
        const images = await google.image('Photosynthesis diagram', { safe: true });
        console.log("Image Results:", images.length || 0);
        if (images.length > 0) {
            console.log(images[0]);
        }

    } catch (e) {
        console.error("GoogleThis failed:", e);
    }
}

test();
