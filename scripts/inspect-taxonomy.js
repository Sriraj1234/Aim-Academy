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

if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
    privateKey = JSON.parse(`{"key": ${privateKey}}`).key;
} else {
    privateKey = privateKey?.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        })
    });
}

const db = admin.firestore();

async function inspectTaxonomy() {
    console.log("🔍 Deep Inspection of SST Chapters...");
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();
    const data = docSnap.data();

    const key = 'bseb_10';
    console.log(`\n--- ${key} ---`);
    if (data[key]) {
        console.log("Registered Subjects:", data[key].subjects);
        
        const sub = 'social_science';
        const chaps = data[key].chapters[sub];
        if (chaps) {
            console.log(`\n[${sub}] (${chaps.length} chapters):`);
            const sections = {};
            chaps.forEach(c => {
                const sec = c.section || 'MISSING';
                sections[sec] = (sections[sec] || []).concat(c.name);
            });
            
            Object.keys(sections).forEach(sec => {
                console.log(`\n📍 Section: ${sec} (${sections[sec].length} chapters)`);
                console.log(`   Sample: ${sections[sec].slice(0, 3).join(', ')}${sections[sec].length > 3 ? '...' : ''}`);
            });
        } else {
            console.log("Social Science chapters not found!");
        }
    } else {
        console.log("Key bseb_10 not found");
    }
}

inspectTaxonomy().catch(console.error);
