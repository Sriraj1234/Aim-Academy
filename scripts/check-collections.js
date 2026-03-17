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

async function checkCollections() {
    const basePath = 'questions/BSEB/Class 10/general';
    const subjects = ['mathematics', 'math', 'social_science', 'science', 'history', 'geography', 'economics', 'political_science'];
    
    console.log(`🔍 Checking Collections in ${basePath}:`);
    
    for (const sub of subjects) {
        const path = `${basePath}/${sub}`;
        const snap = await db.collection(path).limit(1).get();
        if (!snap.empty) {
            console.log(`✅ [${sub}] FOUND questions!`);
            const data = snap.docs[0].data();
            console.log(`   Sample question: ${data.question.substring(0, 50)}...`);
            console.log(`   Actual subject field: ${data.subject}`);
        } else {
            console.log(`❌ [${sub}] EMPTY`);
        }
    }
}

checkCollections();
