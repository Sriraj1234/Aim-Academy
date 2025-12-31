const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// Note: This requires GOOGLE_APPLICATION_CREDENTIALS environment variable or
// a service account key file path key.json in the same directory.
try {
    const serviceAccount = require('./service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.error("Error: 'service-account.json' not found in scripts directory.");
    console.log("Please download your service account key from firebase console project settings -> service accounts");
    console.log("and save it as 'scripts/service-account.json'");
    process.exit(1);
}

const db = admin.firestore();
const BATCH_SIZE = 500;

async function seed() {
    try {
        const dataPath = path.join(__dirname, 'questions.json');
        if (!fs.existsSync(dataPath)) {
            console.error("Error: 'questions.json' file not found.");
            process.exit(1);
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const questions = JSON.parse(rawData);

        console.log(`Found ${questions.length} questions to import...`);

        const collectionRef = db.collection('questions');
        let batch = db.batch();
        let count = 0;
        let total = 0;

        for (const q of questions) {
            // Create a new doc ref (auto-id)
            const docRef = collectionRef.doc();

            // Format question data
            const questionData = {
                ...q,
                createdAt: admin.firestore.Timestamp.now(),
                // Ensure required fields
                year: q.year || 2024,
                marks: q.marks || 1,
                difficulty: q.difficulty || 'medium'
            };

            batch.set(docRef, questionData);
            count++;

            if (count === BATCH_SIZE) {
                await batch.commit();
                total += count;
                console.log(`Imported ${total} questions...`);
                batch = db.batch();
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
            total += count;
        }

        console.log(`Successfully imported ${total} questions!`);

    } catch (error) {
        console.error("Import failed:", error);
    }
}

seed();
