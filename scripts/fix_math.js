const fs = require('fs');
const https = require('https');

// CONFIG
const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// HELPERS
function runQuery(collection, field, operator, value) {
    return new Promise((resolve, reject) => {
        const query = {
            structuredQuery: {
                from: [{ collectionId: collection }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: field },
                        op: operator,
                        value: { stringValue: value }
                    }
                },
                limit: 1000 // Batch size
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
                    // Filter empty results (keep valid docs)
                    const docs = results.filter(r => r.document);
                    resolve(docs.map(d => d.document));
                } else {
                    reject({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', e => reject(e));
        req.write(JSON.stringify(query));
        req.end();
    });
}

function updateDocument(path, fields) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/${path}?updateMask.fieldPaths=subject`, // Only update subject
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        };

        const body = JSON.stringify({ fields });

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getTaxonomy() {
    return new Promise((resolve, reject) => {
        https.get(`https://firestore.googleapis.com${DATABASE_PATH}/metadata/taxonomy`, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });
}

function updateTaxonomy(data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `${DATABASE_PATH}/metadata/taxonomy`,
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        };
        const req = https.request(options, (res) => {
            res.on('end', resolve);
        });
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function fixMath() {
    console.log("1. Finding 'math' questions...");
    try {
        const docs = await runQuery('questions', 'subject', 'EQUAL', 'math');
        console.log(`Found ${docs.length} questions with subject='math'.`);

        if (docs.length > 0) {
            console.log("Renaming to 'mathematics'...");
            let updated = 0;
            for (const doc of docs) {
                // Remove the "projects/aim-83922/databases/(default)/documents/" prefix for update path
                const relativePath = doc.name.split('/documents/')[1];

                await updateDocument(relativePath, {
                    subject: { stringValue: 'mathematics' } // Correct name
                });
                updated++;
                process.stdout.write(`\rUpdated: ${updated}/${docs.length}`);
            }
            console.log("\nRename Complete.");
        } else {
            console.log("No questions found needing rename.");
        }

        console.log("2. Re-Scanning for Taxonomy Update...");
        // Re-fetch ALL mathematics questions to build chapters
        const mathDocs = await runQuery('questions', 'subject', 'EQUAL', 'mathematics');
        console.log(`Total 'mathematics' questions: ${mathDocs.length}`);

        const chapters = {};
        mathDocs.forEach(d => {
            const ch = d.fields.chapter?.stringValue || 'General';
            chapters[ch] = (chapters[ch] || 0) + 1;
        });

        console.log("Chapters found:", chapters);

        // Update Taxonomy
        const currentTax = await getTaxonomy();
        const fields = currentTax.fields || {};

        // Structure for 'bseb_10'
        const key = 'bseb_10'; // Assuming Class 10 BSEB as per script

        let targetData = fields[key]?.mapValue?.fields || { subjects: { arrayValue: { values: [] } }, chapters: { mapValue: { fields: {} } } };

        // 1. Add 'mathematics' to subjects list if missing
        const currentSubjects = targetData.subjects.arrayValue.values || [];
        const hasMath = currentSubjects.some(s => s.stringValue === 'mathematics');

        if (!hasMath) {
            // Remove 'math' if present
            const filtered = currentSubjects.filter(s => s.stringValue !== 'math');
            filtered.push({ stringValue: 'mathematics' });
            targetData.subjects.arrayValue.values = filtered;
        }

        // 2. Update chapters map for mathematics
        const chapterList = Object.entries(chapters).map(([name, count]) => ({
            mapValue: {
                fields: {
                    name: { stringValue: name },
                    count: { integerValue: String(count) }
                }
            }
        }));

        if (!targetData.chapters.mapValue.fields) targetData.chapters.mapValue.fields = {};
        targetData.chapters.mapValue.fields['mathematics'] = {
            arrayValue: { values: chapterList }
        };

        // Write back
        if (!fields[key]) fields[key] = { mapValue: { fields: targetData } };
        else fields[key].mapValue.fields = targetData;

        console.log("Updating Metadata...");
        await updateTaxonomy({ fields });
        console.log("SUCCESS! Taxonomy Updated.");

    } catch (e) {
        console.error("Error:", e);
    }
}

fixMath();
