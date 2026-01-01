const https = require('https');

const PROJECT_ID = "aim-83922";
const DATABASE_PATH = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

https.get(`https://firestore.googleapis.com${DATABASE_PATH}/metadata/taxonomy`, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const json = JSON.parse(data);
        const bseb = json.fields.bseb_10.mapValue.fields;

        console.log("Subjects:", JSON.stringify(bseb.subjects));
        console.log("Chapters (Mathematics):", JSON.stringify(bseb.chapters.mapValue.fields.mathematics));
    });
});
