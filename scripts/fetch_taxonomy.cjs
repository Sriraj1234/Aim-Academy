const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (!rawKey) {
    console.error("FIREBASE_PRIVATE_KEY not found in .env.local");
    process.exit(1);
}

const processedKey = rawKey.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: processedKey,
        })
    });
}

const db = admin.firestore();

async function fetchTaxonomy() {
    console.log("Fetching taxonomy...");
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.log('No such document!');
        return;
    }

    const data = docSnap.data();

    // Check for bseb_10
    const bseb10 = data['bseb_10'];
    if (bseb10) {
        if (bseb10.chapters) {
            const hindiChapters = bseb10.chapters['Hindi'] || bseb10.chapters['hindi'];
            if (hindiChapters) {
                console.log("Found Hindi Chapters:");
                console.log(JSON.stringify(hindiChapters, null, 2));
            } else {
                console.log("No 'Hindi' or 'hindi' key found in chapters.");
                console.log("Available chapter keys:", Object.keys(bseb10.chapters));
            }
        } else {
            console.log("No chapters object found in bseb_10.");
        }
    } else {
        console.log("bseb_10 not found. Available keys:", Object.keys(data));
    }
}

fetchTaxonomy().catch(console.error);
