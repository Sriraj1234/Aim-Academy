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
                        fieldFilter: {
                            field: { fieldPath: 'subject' },
                            op: 'EQUAL',
                            value: { stringValue: 'social science' }
                        }
                    }
                },
                limit: 5000
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

function deleteDocument(docName) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/${docName}`,
            method: 'DELETE'
        };
        const req = https.request(options, (res) => {
            res.on('end', resolve);
        });
        req.on('error', reject);
        req.end();
    });
}

async function nuke() {
    console.log("Fetching ALL Mathematics questions to purge...");
    const docs = await runQuery();
    console.log(`Found ${docs.length} questions.`);

    let deletedCount = 0;
    const CHUNK_SIZE = 50;

    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(doc => deleteDocument(doc.name)));
        deletedCount += chunk.length;
        process.stdout.write(`\rDeleted: ${deletedCount} / ${docs.length}`);
    }

    console.log("\nPurge Complete. Database is clean for 'mathematics'.");
}

nuke();
