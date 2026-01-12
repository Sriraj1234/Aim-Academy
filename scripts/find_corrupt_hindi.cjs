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

async function findCorrupt() {
    console.log("Scanning for CORRUPT Hindi questions...");

    // Fetch ALL hindi questions
    const qSnapshot = await db.collection('questions')
        .where('subject', '==', 'hindi')
        .get();

    console.log(`Total Hindi Docs: ${qSnapshot.size}`);

    let corruptCount = 0;
    const batch = db.batch();

    qSnapshot.forEach(doc => {
        const d = doc.data();
        let isCorrupt = false;
        let reasons = [];

        // Check Options
        if (!d.options || !Array.isArray(d.options) || d.options.length < 2) {
            isCorrupt = true;
            reasons.push(`Invalid Options: ${JSON.stringify(d.options)}`);
        }

        // Check Question Text
        if (!d.question) {
            isCorrupt = true;
            reasons.push("Missing Question Text");
        }

        if (isCorrupt) {
            corruptCount++;
            console.log(`\n❌ Corrupt Doc: ${doc.id}`);
            console.log(`   Reasons: ${reasons.join(', ')}`);
            // Uncomment to delete
            // batch.delete(doc.ref);
        }
    });

    console.log(`\nScan Complete. Found ${corruptCount} corrupt documents.`);
}

findCorrupt().then(() => process.exit(0));
