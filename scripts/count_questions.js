const https = require('https');
const fs = require('fs');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAllQuestions() {
    let allDocs = [];
    let offset = 0;
    const LIMIT = 5000;

    console.log("Starting Count... (This may take a moment)");

    while (true) {
        const query = {
            structuredQuery: {
                from: [{ collectionId: 'questions' }],
                limit: LIMIT,
                offset: offset,
                select: {
                    fields: [{ fieldPath: 'subject' }]
                }
            }
        };

        const batch = await new Promise((resolve, reject) => {
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
                    if (res.statusCode !== 200) {
                        resolve([]);
                        return;
                    }
                    const results = JSON.parse(data);
                    if (!Array.isArray(results)) {
                        resolve([]);
                        return;
                    }
                    const docs = results.filter(r => r.document).map(r => r.document);
                    resolve(docs);
                });
            });
            req.write(JSON.stringify(query));
            req.end();
        });

        if (batch.length === 0) break;

        allDocs = allDocs.concat(batch);
        offset += LIMIT;
        // console.log(`Scanned: ${allDocs.length} questions...`);

        if (batch.length < LIMIT) break;
    }
    return allDocs;
}

async function report() {
    const docs = await getAllQuestions();

    const stats = {};
    docs.forEach(doc => {
        let subject = doc.fields?.subject?.stringValue?.toLowerCase() || 'unknown';
        subject = subject.trim();
        if (subject === 'math') subject = 'mathematics';
        stats[subject] = (stats[subject] || 0) + 1;
    });

    let output = "=== DATABASE REPORT ===\n";
    output += `Total Questions: ${docs.length}\n`;
    output += "--------------------------\n";

    Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([subject, count]) => {
            output += `${subject.padEnd(20)} : ${count}\n`;
        });
    output += "==========================\n";

    fs.writeFileSync('e:\\AIM 2\\aim-academy\\count_report.txt', output);
    console.log("Report saved to count_report.txt");
}

report();
