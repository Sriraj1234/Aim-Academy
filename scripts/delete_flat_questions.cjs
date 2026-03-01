/**
 * Delete OLD flat questions collection AFTER verifying the new hierarchical structure.
 * Run ONLY after confirming the new subcollections work correctly in the app.
 * 
 * Run: node scripts/delete_flat_questions.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) { console.error('Missing FIREBASE_PRIVATE_KEY'); process.exit(1); }
    if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        })
    });
}

const db = admin.firestore();

async function deleteFlatQuestions() {
    console.log('WARNING: This will permanently delete ALL docs from the flat "questions" collection.');
    console.log('Make sure new hierarchical subcollections are working before running this!');
    console.log('Starting in 3 seconds...');
    await new Promise(r => setTimeout(r, 3000));

    let deletedCount = 0;
    let hasMore = true;

    while (hasMore) {
        const snapshot = await db.collection('questions').limit(400).get();

        if (snapshot.empty) {
            hasMore = false;
            break;
        }

        // Only delete documents that are DIRECT children (not subcollection parents)
        const batch = db.batch();
        let count = 0;
        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            count++;
        }
        await batch.commit();
        deletedCount += count;
        console.log(`Deleted ${deletedCount} flat documents...`);
    }

    console.log(`\nDone! Deleted ${deletedCount} documents from flat questions collection.`);
}

deleteFlatQuestions().catch(console.error);
