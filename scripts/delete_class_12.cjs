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

async function deleteClass12Questions() {
    const isForce = process.argv.includes('--force');

    console.log('Scanning for Class 12 questions...');

    // Check strict string "12" and "12th" just in case
    const q1 = await db.collection('questions').where('class', '==', '12').get();
    const q2 = await db.collection('questions').where('class', '==', '12th').get();

    const allDocs = new Map();
    q1.forEach(d => allDocs.set(d.id, d.ref));
    q2.forEach(d => allDocs.set(d.id, d.ref));

    console.log(`\nFound ${allDocs.size} questions for Class 12.`);

    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'count.txt'), String(allDocs.size));

    if (allDocs.size === 0) {
        console.log('No data found to delete.');
        return;
    }

    if (!isForce) {
        console.log('\n[DRY RUN] No changes made.');
        console.log('To actually delete these documents, run with --force flag.');
        return;
    }

    console.log(`\n[DELETING] Starting deletion of ${allDocs.size} documents...`);
    const batchSize = 400;
    const docs = Array.from(allDocs.values());
    let deletedCount = 0;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach(ref => batch.delete(ref));
        await batch.commit();
        deletedCount += chunk.length;
        console.log(`Deleted ${deletedCount}/${docs.length}`);
    }

    console.log('\nDeletion Complete.');
}

deleteClass12Questions();
