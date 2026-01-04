import { GOOGLE_IMG_SCRAP } from 'google-img-scrap';

async function test() {
    try {
        console.log("Testing Google Image Scrap for 'Photosynthesis diagram'...");
        const result = await GOOGLE_IMG_SCRAP({
            search: "Photosynthesis diagram",
            limit: 5,
            excludeDomains: ["stock.adobe.com", "shutterstock.com"] // optional
        });

        console.log("Images found:", result?.result?.length || 0);
        if (result?.result?.length > 0) {
            console.log("First Image:", result.result[0]);
        }
    } catch (e) {
        console.error("GIS failed:", e);
    }
}

test();
