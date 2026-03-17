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

async function checkScience() {
    console.log("--- SCIENCE CHECK ---");
    
    const subs = ['science', 'physics', 'chemistry', 'biology'];
    const board = 'BSEB';
    const cls = 'Class 10';
    const stream = 'general';

    for (const sub of subs) {
        const path = `questions/${board}/${cls}/${stream}/${sub}`;
        const snap = await db.collection(path).get();
        console.log(`Path: ${path} -> Count: ${snap.size}`);
        if (snap.size > 0) {
            console.log(`  Example Chapter: ${snap.docs[0].data().chapter}`);
        }
    }

    console.log("--- DONE ---");
}

checkScience().catch(console.error);
