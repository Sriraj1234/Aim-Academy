require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log("Fetching models...");
        // There isn't a direct listModels on genAI instance in some SDK versions,
        // but let's try the model manager if exposed or just try a standard fetch if SDK doesn't expose it easily.
        // Actually the SDK doesn't always expose listModels directly on the main class unless we use the model manager.
        // Let's use a direct fetch to the API endpoint to be sure, avoiding SDK version guess.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        const fs = require('fs');
        let out = "Available Models:\n";

        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    out += `- ${m.name} (${m.displayName})\n`;
                }
            });
        } else {
            out += "No models found or error: " + JSON.stringify(data, null, 2);
        }

        fs.writeFileSync('gemini_models.txt', out);
        console.log("Written to gemini_models.txt");

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
