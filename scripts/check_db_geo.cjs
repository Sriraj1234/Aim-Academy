const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function runQuery() {
    return new Promise((resolve, reject) => {
        const query = {
            structuredQuery: {
                from: [{ collectionId: 'questions' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'subject' },
                        op: 'EQUAL',
                        value: { stringValue: 'geography' }
                    }
                },
                limit: 100 // Get enough to see variation
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
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const results = JSON.parse(data);
                    const docs = results.filter(r => r.document).map(r => r.document);
                    resolve(docs);
                } else {
                    reject(data);
                }

            });
        });
        req.on('error', reject);
        req.write(JSON.stringify(query));
        req.end();
    });
}

async function check() {
    console.log("Checking DB for Geography...");
    try {
        const docs = await runQuery();
        console.log(`Found ${docs.length} Geography docs.`);

        const chapters = new Set();
        docs.forEach(d => {
            if (d.fields.chapter) {
                chapters.add(d.fields.chapter.stringValue);
            }
        });

        const chaptersList = Array.from(chapters);
        console.log("Unique Chapters in DB:", chaptersList);
        const fs = require('fs');
        fs.writeFileSync('geo_db_chapters.json', JSON.stringify(chaptersList, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
check();
