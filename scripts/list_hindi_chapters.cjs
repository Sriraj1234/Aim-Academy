const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (!rawKey) process.exit(1);

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
const fs = require('fs');

async function listChapters() {
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) return;

    const data = docSnap.data();
    const bseb10 = data['bseb_10'];

    if (bseb10 && bseb10.chapters) {
        const hindiChapters = bseb10.chapters['Hindi'] || bseb10.chapters['hindi'];
        if (hindiChapters) {
            fs.writeFileSync('hindi_chapters.json', JSON.stringify(hindiChapters, null, 2));
            console.log("Written to hindi_chapters.json");
        } else {
            console.log("No Hindi chapters found.");
            fs.writeFileSync('hindi_chapters.json', JSON.stringify([], null, 2));
        }
    }
}

listChapters().catch(console.error);
