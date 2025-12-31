
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
// Assuming serviceAccountKey.json is in the scripts folder or root
// Adjust path as necessary. If env var is used, use that instead.
// For local script execution, hardcoded path to key is typical or use existing setup.
// Checking previous context, it seems standard admin setup is available.

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Initialize Firebase with environment variables
const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error("Missing Firebase credentials in .env.local");
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function clearTaxonomy() {
    console.log("Starting taxonomy cleanup...");
    const taxonomyRef = db.doc('metadata/taxonomy');

    try {
        const doc = await taxonomyRef.get();
        if (!doc.exists) {
            console.log("No taxonomy metadata found.");
            return;
        }

        console.log("Found taxonomy data. Clearing...");

        // Use set to overwrite with empty object or specific initial structure if needed.
        // The user said "delete kar do", implying removal of content.
        // We will reset it to an empty object or just delete the fields 'subjects' and 'chapters'.
        // Safest is to set it to an empty state or delete the doc and recreate blank if needed.
        // Let's delete the document contents effectively.

        await taxonomyRef.set({
            subjects: {},
            chapters: {},
            lastUpdated: new Date()
        });

        console.log("Taxonomy metadata cleared successfully.");
    } catch (error) {
        console.error("Error clearing taxonomy:", error);
    }
}

clearTaxonomy();
