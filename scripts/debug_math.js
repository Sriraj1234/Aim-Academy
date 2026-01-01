const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function runQuery(collection) {
    return new Promise((resolve, reject) => {
        const query = {
            structuredQuery: {
                from: [{ collectionId: collection }],
                limit: 5
            }
        };

        const options = {
            hostname: 'firestore.googleapis.com',
            path: `${DATABASE_PATH}:runQuery`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const results = JSON.parse(data);
                const docs = results.filter(r => r.document).map(r => r.document);
                resolve(docs);
            });
        });
        req.write(JSON.stringify(query));
        req.end();
    });
}

async function debug() {
    console.log("Checking for 'mathematics' questions...");
    try {
        const docs = await runQuery('questions');
        console.log(`Found ${docs.length} docs.`);

        if (docs.length > 0) {
            console.log("\nSample Doc:");
            console.log(JSON.stringify(docs[0].fields, null, 2));

            // Check chapters
            const chapters = docs.map(d => d.fields.chapter?.stringValue);
            console.log("\nChapters sample:", chapters);
        } else {
            console.log("No docs found. Trying 'math'...");
            // You could add fallback check here
        }
    } catch (e) {
        console.error(e);
    }
}

debug();
