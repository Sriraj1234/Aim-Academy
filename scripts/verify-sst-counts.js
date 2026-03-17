import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

async function checkSSTChapters() {
    console.log("--- SST CHAPTER VERIFICATION for BSEB 10 ---");
    const docSnap = await db.collection('metadata').doc('taxonomy').get();
    const data = docSnap.data();
    
    const chapters = data['bseb_10']?.chapters?.['social_science'] || [];
    
    const targetSections = ['Political Science', 'Disaster Management'];
    
    targetSections.forEach(section => {
        const sectionChapters = chapters.filter(c => c.section === section);
        console.log(`\n📍 Section: ${section} (${sectionChapters.length} chapters found)`);
        sectionChapters.forEach(c => {
            console.log(`   - Chapter: ${c.name} (Count: ${c.count})`);
        });
    });
}

checkSSTChapters().catch(console.error);
