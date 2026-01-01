const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAllQuestions() {
    let allDocs = [];
    let offset = 0;
    const LIMIT = 5000;

    while (true) {
        console.log(`Fetching batch at offset ${offset}...`);
        const query = {
            structuredQuery: {
                from: [{ collectionId: 'questions' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            { fieldFilter: { field: { fieldPath: 'board' }, op: 'EQUAL', value: { stringValue: 'bseb' } } },
                            { fieldFilter: { field: { fieldPath: 'class' }, op: 'EQUAL', value: { stringValue: '10' } } }
                        ]
                    }
                },
                limit: LIMIT,
                offset: offset
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
                    const results = JSON.parse(data);
                    if (!Array.isArray(results)) {
                        console.error("Query Error or Empty:", results);
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
        console.log(`Received ${batch.length} docs. Total so far: ${allDocs.length}`);

        if (batch.length < LIMIT) break; // End of collection
    }

    return allDocs;
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

async function rebuild() {
    console.log("Fetching ALL BSEB 10 questions (Paginated)...");
    const docs = await getAllQuestions();
    console.log(`Total Fetched Questions: ${docs.length}`);

    const taxonomy = {};
    const debugSubjects = new Set();

    docs.forEach(doc => {
        const fields = doc.fields;
        let subject = fields.subject?.stringValue?.toLowerCase() || 'unknown';

        // Normalize
        if (subject === 'math') subject = 'mathematics';
        if (subject.includes('social')) subject = 'social science';

        // Normalize spaces
        subject = subject.trim();
        debugSubjects.add(subject);

        let chapter = fields.chapter?.stringValue || 'General';

        if (!taxonomy[subject]) taxonomy[subject] = {};
        taxonomy[subject][chapter] = (taxonomy[subject][chapter] || 0) + 1;
    });

    console.log("Found Subjects:", Array.from(debugSubjects));
    console.log("Calculated Taxonomy Stats:");
    Object.keys(taxonomy).forEach(s => {
        console.log(`  ${s}: ${Object.keys(taxonomy[s]).length} chapters, ${Object.values(taxonomy[s]).reduce((a, b) => a + b, 0)} Qs`);
    });

    const subjectsList = Object.keys(taxonomy);
    const existingChaptersMap = {};

    subjectsList.forEach(sub => {
        const chapters = Object.entries(taxonomy[sub]).map(([name, count]) => ({
            mapValue: {
                fields: {
                    name: { stringValue: name },
                    count: { integerValue: String(count) }
                }
            }
        }));
        existingChaptersMap[sub] = { arrayValue: { values: chapters } };
    });

    const updatePayload = {
        fields: {
            "bseb_10": {
                mapValue: {
                    fields: {
                        subjects: {
                            arrayValue: {
                                values: subjectsList.map(s => ({ stringValue: s }))
                            }
                        },
                        chapters: {
                            mapValue: {
                                fields: existingChaptersMap
                            }
                        }
                    }
                }
            }
        }
    };

    console.log("Updating Firestore...");
    await updateTaxonomy(updatePayload);
    console.log("DONE! Taxonomy fully synchronized.");
}

rebuild();
