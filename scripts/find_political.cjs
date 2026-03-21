const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

async function findPolitical() {
    console.log("--- Searching for Political Science & Disaster Management folders ---");
    const boards = ['BSEB', 'CBSE', 'bseb'];
    const classes = ['Class 10', 'Class 9'];
    const streams = ['general', 'General'];
    
    for (const board of boards) {
        for (const cls of classes) {
            for (const stream of streams) {
                const basePath = `questions/${board}/${cls}/${stream}`;
                try {
                    const baseRef = db.doc(basePath);
                    const collections = await baseRef.listCollections();
                    const colIds = collections.map(c => c.id);
                    if (colIds.length > 0) {
                        console.log(`PATH [${basePath}]: collections = [${colIds.join(', ')}]`);
                    }
                } catch (e) {
                    // skip
                }
            }
        }
    }
    console.log("--- DONE ---");
}

findPolitical().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
