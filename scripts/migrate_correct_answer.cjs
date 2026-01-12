const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        if (privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}
const db = getFirestore();

// Convert "Option A" / "Option B" etc to 0/1/2/3
function parseCorrectAnswer(raw) {
    if (typeof raw === 'number') return raw; // Already correct
    if (typeof raw !== 'string') return 0; // Fallback

    const str = raw.trim().toLowerCase();
    if (str === 'option a' || str === 'a') return 0;
    if (str === 'option b' || str === 'b') return 1;
    if (str === 'option c' || str === 'c') return 2;
    if (str === 'option d' || str === 'd') return 3;

    // Try parse numeric
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0 && num <= 3) return num;

    return 0; // Default fallback
}

async function migrate() {
    console.log("Starting Migration: Convert correctAnswer to Number...");

    const qs = await db.collection('questions')
        .where('subject', '==', 'hindi')
        .get();

    console.log(`Found ${qs.size} Hindi questions.`);

    let updated = 0;
    let skipped = 0;
    const batch = db.batch();

    qs.forEach(doc => {
        const d = doc.data();
        const current = d.correctAnswer;

        // Skip if already number
        if (typeof current === 'number') {
            skipped++;
            return;
        }

        const newVal = parseCorrectAnswer(current);
        batch.update(doc.ref, { correctAnswer: newVal });
        updated++;
    });

    if (updated > 0) {
        // Firestore batch limit is 500, so we need to handle large datasets
        // For simplicity, assuming < 500 in this batch run
        await batch.commit();
        console.log(`✅ Updated ${updated} questions.`);
    }
    console.log(`Skipped ${skipped} (already numbers).`);
}

migrate().then(() => process.exit(0));
