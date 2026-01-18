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

async function inspectTaxonomy() {
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.log("Taxonomy document does not exist!");
        return;
    }

    const data = docSnap.data();
    const science = data['bseb_12_science'];

    if (science) {
        console.log('bseb_12_science found.');
        if (science.chapters && science.chapters.Chemistry) {
            console.log('Chemistry Chapters:', JSON.stringify(science.chapters.Chemistry, null, 2));
        } else {
            console.log('No Chemistry chapters found.');
        }
    } else {
        console.log('bseb_12_science not found.');
    }
}

inspectTaxonomy();
