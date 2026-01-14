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

// Map "Option A" -> 0, "Option B" -> 1, etc.
const OPTION_MAP = {
    'Option A': 0, 'option a': 0, 'A': 0, 'a': 0,
    'Option B': 1, 'option b': 1, 'B': 1, 'b': 1,
    'Option C': 2, 'option c': 2, 'C': 2, 'c': 2,
    'Option D': 3, 'option d': 3, 'D': 3, 'd': 3,
};

async function fixCorrectAnswers() {
    console.log('Fixing Correct Answers for Class 12 BSEB...');

    const snapshot = await db.collection('questions')
        .where('board', '==', 'bseb')
        .where('class', '==', '12')
        .get();

    console.log(`Found ${snapshot.size} questions to check.`);

    let fixedCount = 0;
    const batchSize = 400;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentAnswer = data.correctAnswer;
        const options = data.options || [];

        // Check if currentAnswer is "Option X" format
        const trimmed = (currentAnswer || '').trim();
        const index = OPTION_MAP[trimmed];

        if (index !== undefined && options[index]) {
            // Fix it!
            batch.update(doc.ref, { correctAnswer: options[index] });
            fixedCount++;
            batchCount++;

            if (batchCount >= batchSize) {
                await batch.commit();
                console.log(`Committed batch of ${batchCount} updates...`);
                batch = db.batch();
                batchCount = 0;
            }
        }
    }

    if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} updates.`);
    }

    console.log(`\nFixed ${fixedCount} questions.`);
}

fixCorrectAnswers().catch(console.error);
