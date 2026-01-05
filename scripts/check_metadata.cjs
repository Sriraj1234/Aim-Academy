const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getTaxonomy() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `${DATABASE_PATH}/metadata/taxonomy`,
            method: 'GET',
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    console.log("Status:", res.statusCode);
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function check() {
    const doc = await getTaxonomy();
    if (doc) {
        console.log("Taxonomy Document Found.");
        const categories = doc.fields.categories?.arrayValue?.values || [];
        console.log("Categories Count:", categories.length);

        categories.forEach(cat => {
            const map = cat.mapValue.fields;
            const name = map.name.stringValue;
            const chapters = map.chapters?.arrayValue?.values || [];
            console.log(`Subject: ${name}, Chapters: ${chapters.length}`);
            if (name.toLowerCase() === 'geography') {
                console.log("Geography Chapters:", chapters.map(c => c.stringValue));
            }
        });
    } else {
        console.log("No taxonomy document found!");
    }
}
check();
