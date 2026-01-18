const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// --- Firebase Initialization ---
try {
    const envPathLocal = path.join(__dirname, '..', '.env.local');
    const envPath = path.join(__dirname, '..', '.env');

    dotenv.config({ path: envPath });
    dotenv.config({ path: envPathLocal, override: true });

    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey && privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
    process.exit(1);
}

const db = admin.firestore();
const BATCH_SIZE = 400; // Batch limit is 500

async function fixBoardName() {
    const questionsRef = db.collection('questions');

    // Find questions with the incorrect board name from our recent upload source
    // Querying by source is safer to avoid affecting other potential data
    // But we also want to target exactly "Bihar Board"
    const snapshot = await questionsRef
        .where('source', '==', 'excel_upload_jan_2026')
        .where('board', '==', 'Bihar Board')
        .get();

    if (snapshot.empty) {
        console.log("No questions found with board 'Bihar Board' and source 'excel_upload_jan_2026'.");
        return;
    }

    console.log(`Found ${snapshot.size} documents to update.`);

    const batches = [];
    let currentBatch = db.batch();
    let counter = 0;

    snapshot.docs.forEach((doc) => {
        currentBatch.update(doc.ref, { board: 'bseb' });
        counter++;

        if (counter >= BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            counter = 0;
        }
    });

    if (counter > 0) {
        batches.push(currentBatch);
    }

    console.log(`Committing ${batches.length} batches...`);

    let totalUpdated = 0;
    for (const batch of batches) {
        await batch.commit();
        totalUpdated += BATCH_SIZE; // Approximate logging
        process.stdout.write('.');
    }

    console.log(`\n✅ Successfully updated ${snapshot.size} documents to board: 'bseb'.`);
}

fixBoardName();
