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

async function testQuery() {
    // Mimics the App's "12 Science" user
    const userClass = "12 Science";
    const normalizedClass = "12";
    const classVariants = [userClass, normalizedClass, 12]; // Mix of string/number

    const subject = "hindi";
    // Using a sample chapter name I saw in logs, or fetch first available
    let chapter = "Kadbakk";

    // Try fetching ANY chapter first if not sure
    const sample = await db.collection('questions')
        .where('subject', '==', 'hindi')
        .limit(1).get();

    if (!sample.empty) {
        chapter = sample.docs[0].data().chapter;
        console.log(`Using real chapter from DB: "${chapter}"`);
    } else {
        console.log("No hindi questions found at all! Aborting.");
        return;
    }

    console.log(`\nTesting Query:`);
    console.log(`Board: BSEB`);
    console.log(`Class IN: ${JSON.stringify(classVariants)}`);
    console.log(`Subject: ${subject}`);
    console.log(`Chapter: ${chapter}`);

    try {
        const q = db.collection('questions')
            // .where('board', '==', 'BSEB') // Usually app lowercase? let's check profile
            .where('board', '==', 'BSEB') // Script uploaded as BSEB
            .where('class', 'in', classVariants) // The 'IN' query
            .where('subject', '==', subject)
            .where('chapter', '==', chapter)
            .limit(5);

        const snapshot = await q.get();
        console.log(`\nResults Found: ${snapshot.size}`);
        snapshot.forEach(d => console.log(` - ${d.id}`));
    } catch (e) {
        console.error("\nQUERY FAILED:", e.message);
        if (e.message.includes('index')) {
            console.log("\n🔥 MISSING INDEX DETECTED!");
        }
    }
}

testQuery().then(() => process.exit(0));
