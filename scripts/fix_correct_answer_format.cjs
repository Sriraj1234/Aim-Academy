const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

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
const BATCH_SIZE = 100;

async function fixCorrectAnswer() {
    console.log("Starting migration (Sequential Commit)...");
    const questionsRef = db.collection('questions');

    let snapshot;
    try {
        snapshot = await questionsRef
            .where('source', '==', 'excel_upload_jan_2026')
            .get();
    } catch (err) {
        console.error("Query failed:", err);
        return;
    }

    if (snapshot.empty) {
        console.log("No questions found.");
        return;
    }

    console.log(`Found ${snapshot.size} documents.`);

    let batch = db.batch();
    let batchCount = 0;
    let totalUpdated = 0;
    let skippedCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentAnswer = data.correctAnswer;
        const options = data.options;

        let shouldUpdate = false;
        let newAnswer = null;

        if (typeof currentAnswer === 'number') {
            skippedCount++;
            continue; // Already corrected
        }

        if (Array.isArray(options)) {
            // 1. Try finding the answer text directly in options
            let index = options.indexOf(currentAnswer);
            if (index === -1) {
                index = options.findIndex(opt => String(opt).trim() === String(currentAnswer).trim());
            }

            // 2. If not found, check if it's "Option A", "A", etc. using Regex
            if (index === -1 && typeof currentAnswer === 'string') {
                const mapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

                // Matches "Option A", "Option A,", "Option: A", "Option A (misc)"
                const match = currentAnswer.match(/Option[:\s]*([A-D])/i);

                if (match) {
                    const letter = match[1].toUpperCase();
                    if (mapping.hasOwnProperty(letter)) {
                        index = mapping[letter];
                    }
                } else {
                    // Check direct "A", "B", "C", "D" (cleaned up)
                    const clean = currentAnswer.trim().replace(/[,.]/g, '').toUpperCase();
                    if (mapping.hasOwnProperty(clean)) {
                        index = mapping[clean];
                    }
                }
            }

            if (index !== -1) {
                newAnswer = index;
                shouldUpdate = true;
            } else {
                // console.warn(`Doc ${doc.id}: Answer "${currentAnswer}" not found.`);
                skippedCount++;
            }
        } else {
            skippedCount++;
        }

        if (shouldUpdate) {
            batch.update(doc.ref, { correctAnswer: newAnswer });
            batchCount++;
            totalUpdated++;
        }

        if (batchCount >= BATCH_SIZE) {
            try {
                await batch.commit();
                process.stdout.write('.');
            } catch (err) {
                console.error("\nBatch commit failed:", err.message);
            }
            batch = db.batch();
            batchCount = 0;
        }
    }

    // Commit final batch
    if (batchCount > 0) {
        try {
            await batch.commit();
            console.log("\nFinal batch committed.");
        } catch (err) {
            console.error("\nFinal batch commit failed:", err.message);
        }
    }

    console.log(`\n✅ Finished. Total Updated: ${totalUpdated}. Skipped: ${skippedCount}.`);
}

fixCorrectAnswer();
