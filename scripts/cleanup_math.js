const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const ALLOWED_CHAPTERS = [
    "वास्तविक संख्याएँ",
    "बहुपद",
    "दो चर वाले रैखिक समीकरणों का युग्म",
    "द्विघात समीकरण",
    "समानांतर श्रेढ़ियाँ",
    "त्रिभुज",
    "निर्देशांक ज्यामिति",
    "त्रिकोणमिति का परिचय",
    "त्रिकोणमिति के प्रयोग",
    "वृत",
    "रचनाएँ",
    "वृतों से संबंधित क्षेत्रफल",
    "पृष्ठीय क्षेत्रफल एवं आयतन",
    "सांख्यिकी",
    "प्रायिकता"
];

function runQuery() {
    return new Promise((resolve, reject) => {
        const query = {
            structuredQuery: {
                from: [{ collectionId: 'questions' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'subject' },
                        op: 'EQUAL',
                        value: { stringValue: 'mathematics' }
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

function updateDocument(docName, fields) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/${docName}?updateMask.fieldPaths=chapter`,
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        };
        const body = JSON.stringify({ fields });
        const req = https.request(options, (res) => {
            res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(body);
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

async function cleanup() {
    console.log("Fetching Mathematics questions...");
    const docs = await runQuery();
    console.log(`Checking ${docs.length} questions.`);

    let deletedCount = 0;
    let keptCount = 0;
    let renamedCount = 0;
    const unknownChapters = new Set();

    for (const doc of docs) {
        let chapter = doc.fields.chapter?.stringValue?.trim();

        // Auto-Fix specific mismatches
        // "और" vs "एवं"
        if (chapter === "पृष्ठीय क्षेत्रफल और आयतन") {
            const newName = "पृष्ठीय क्षेत्रफल एवं आयतन";
            console.log(`Renaming: [${chapter}] -> [${newName}]`);
            // Helper handles full path via doc.name ? No, doc.name includes projects/...
            // The helper I wrote uses /v1/${docName}. docName starts with projects/...
            // Path becomes /v1/projects/... -> Correct.

            // Wait, doc.name from runQuery is "projects/..."
            // My helper: path: /v1/${docName}
            // So: /v1/projects/...
            // This is correct for Firestore REST API.

            await updateDocument(doc.name, {
                chapter: { stringValue: newName }
            });
            renamedCount++;
            keptCount++;
            continue;
        }

        if (!chapter || !ALLOWED_CHAPTERS.includes(chapter)) {
            unknownChapters.add(chapter);
            console.log(`Deleting: [${chapter}]`);
            await deleteDocument(doc.name);
            deletedCount++;
        } else {
            keptCount++;
        }
    }

    console.log("\n--- CLEANUP REPORT ---");
    console.log(`Verified Safe: ${keptCount}`);
    console.log(`Renamed: ${renamedCount}`);
    console.log(`Deleted: ${deletedCount}`);
    console.log("Removed Chapters:", Array.from(unknownChapters));
    console.log("----------------------");
}

cleanup();
