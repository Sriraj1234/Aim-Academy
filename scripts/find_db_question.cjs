const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function runQuery() {
    return new Promise((resolve, reject) => {
        const query = {
            structuredQuery: {
                from: [{ collectionId: 'questions' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'subject' },
                                    op: 'EQUAL',
                                    value: { stringValue: 'geography' }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'chapter' },
                                    op: 'EQUAL',
                                    value: { stringValue: 'जल संसाधन' }
                                }
                            }
                        ]
                    }
                },
                limit: 1
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

async function check() {
    const docs = await runQuery();
    if (docs.length > 0) {
        console.log("Question Text:", docs[0].fields.question.stringValue);
        const fs = require('fs');
        fs.writeFileSync('sample_geo_question.txt', docs[0].fields.question.stringValue);
    } else {
        console.log("No docs found for Jal Sansadhan");
    }
}
check();
