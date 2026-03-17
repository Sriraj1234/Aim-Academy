import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase Admin credentials in .env.local');
    process.exit(1);
}

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = JSON.parse(`{"key": ${privateKey}}`).key;
} else {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    })
});

const db = admin.firestore();

async function inspectTaxonomy() {
    console.log("🔍 Deep Inspection of Taxonomy Metadata...");
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();
    const data = docSnap.data();

    const key = 'bseb_10';
    console.log(`\n--- ${key} ---`);
    if (data[key]) {
        console.log("Registered Subjects:", data[key].subjects);
        console.log("Actual Chapter Categories:", Object.keys(data[key].chapters));
        
        const subjectsToCheck = ['social_science', 'mathematics', 'math', 'history', 'geography', 'economics', 'political_science'];
        
        subjectsToCheck.forEach(sub => {
            const chaps = data[key].chapters[sub];
            if (chaps) {
                console.log(`\n[${sub}] (${chaps.length} chapters):`);
                // Group by section to see how they are distributed
                const sections = {};
                chaps.forEach(c => {
                    const sec = c.section || 'MISSING';
                    sections[sec] = (sections[sec] || 0) + 1;
                });
                console.log("Sections distribution:", sections);
                console.log("Sample chapter:", chaps[0]);
            }
        });
    } else {
        console.log("Key not found");
    }
}

inspectTaxonomy();
