import { search } from 'duck-duck-scrape';
import fs from 'fs';

async function test() {
    try {
        console.log("Testing DuckDuckGo...");
        const textResults = await search('test');
        console.log("Results:", textResults.results.length);
    } catch (e) {
        const errorLog = `Error: ${e.message}\nStack: ${e.stack}\nResponse: ${JSON.stringify(e.response?.data || {})}`;
        fs.writeFileSync('error.txt', errorLog);
        console.log("Error written to error.txt");
    }
}

test();
