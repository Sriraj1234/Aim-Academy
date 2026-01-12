const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        if (privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}
const db = getFirestore();

async function run() {
    console.log("--- INSPECTING HINDI QUESTION OPTIONS ---");

    const qs = await db.collection('questions')
        .where('subject', '==', 'hindi')
        .limit(5)
        .get();

    console.log(`Found ${qs.size} Hindi questions.\n`);

    qs.forEach(doc => {
        const d = doc.data();
        console.log(`Doc: ${doc.id}`);
        console.log(`  Question: ${(d.question || '').substring(0, 50)}...`);
        console.log(`  Options Type: ${typeof d.options}`);
        console.log(`  Options Value: ${JSON.stringify(d.options)}`);
        console.log(`  correctAnswer: ${d.correctAnswer}`);
        console.log("");
    });
}

run().then(() => process.exit(0));
