const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    } catch (error) { console.error(error); process.exit(1); }
}

const db = getFirestore();

async function countQuestions() {
    console.log('Counting questions...');
    const snapshot = await db.collection('questions').get();
    console.log(`Total questions in 'questions' collection: ${snapshot.size}`);

    const counts = {};
    const sampleDocs = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.board}_${data.class}_${data.subject}`;

        if (!counts[key]) counts[key] = 0;
        counts[key]++;

        if (!sampleDocs[key]) {
            sampleDocs[key] = data;
        }
    });

    console.log('\n--- Counts by Board/Class/Subject (Class 12 Only) ---');
    for (const [key, count] of Object.entries(counts)) {
        if (key.includes('_12')) {
            console.log(`${key}: ${count}`);
        }
    }

    console.log('\n--- Sample Data Inspection (First doc for likely candidates) ---');
    // Check specifically for what user mentioned (likely bseb_12_English or Hindi)
    const targetKeys = Object.keys(sampleDocs).filter(k => k.toLowerCase().includes('english') || k.toLowerCase().includes('hindi'));

    targetKeys.forEach(key => {
        console.log(`\nSample for ${key}:`);
        console.log(JSON.stringify(sampleDocs[key], null, 2));
    });
}

countQuestions();
