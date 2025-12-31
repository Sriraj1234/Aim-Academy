const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Checks for service-account.json in the current directory or GOOGLE_APPLICATION_CREDENTIALS
try {
    let serviceAccount;
    try {
        serviceAccount = require('./service-account.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            admin.initializeApp();
        } else {
            throw new Error("Service account not found");
        }
    }
} catch (e) {
    console.error("Error: 'service-account.json' not found in scripts directory and GOOGLE_APPLICATION_CREDENTIALS not set.");
    console.log("Please download your service account key from firebase console -> project settings -> service accounts");
    console.log("and save it as 'scripts/service-account.json'");
    process.exit(1);
}

const db = admin.firestore();

async function main() {
    try {
        console.log("Starting deletion of collections...");

        const metadataRef = db.collection('metadata');
        console.log("Deleting 'metadata' collection...");
        await db.recursiveDelete(metadataRef);
        console.log("Successfully deleted 'metadata'.");

        const questionsRef = db.collection('questions');
        console.log("Deleting 'questions' collection...");
        await db.recursiveDelete(questionsRef);
        console.log("Successfully deleted 'questions'.");

        console.log("All specified collections deleted.");
    } catch (error) {
        console.error("Error deleting collections:", error);
        process.exit(1);
    }
}

main();
