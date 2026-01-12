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

async function checkMismatch() {
    console.log("--- CHECKING CLASS 12 HINDI MISMATCH ---");

    // 1. Get Taxonomy
    const taxSnap = await db.collection('metadata').doc('taxonomy').get();
    if (!taxSnap.exists) { console.log("No taxonomy."); return; }

    // Check multiple keys to be sure
    const keysToCheck = ['bseb_12', 'BSEB_12', 'bseb_12_science', 'bseb_12_arts'];
    let foundChapters = [];

    for (const key of keysToCheck) {
        const data = taxSnap.data()[key];
        if (data && data.chapters && data.chapters['hindi']) {
            console.log(`Found taxonomy key: ${key}`);
            foundChapters = data.chapters['hindi'];
            break;
        }
    }

    if (foundChapters.length === 0) {
        console.log("❌ No Hindi chapters found in taxonomy under expected keys.");
        return;
    }

    console.log(`Taxonomy has ${foundChapters.length} Hindi chapters.`);

    // 2. Pick top 3 and check exact match in DB
    const sampleSize = 5;
    for (let i = 0; i < Math.min(foundChapters.length, sampleSize); i++) {
        const chapObj = foundChapters[i];
        const chapName = typeof chapObj === 'string' ? chapObj : chapObj.name;

        console.log(`\nChecking Chapter: "${chapName}"`);

        const qSnap = await db.collection('questions')
            .where('subject', '==', 'hindi')
            .where('board', '==', 'BSEB')
            .where('chapter', '==', chapName)
            .limit(1)
            .get();

        if (qSnap.empty) {
            console.log(`  ❌ ZERO matches in DB for strict equality.`);
            // Try lenient search to debug
            const lenientSnap = await db.collection('questions')
                .where('subject', '==', 'hindi')
                .where('board', '==', 'BSEB')
                .limit(50)
                .get();

            let potentialMatch = "None";
            lenientSnap.forEach(d => {
                const dbChap = d.data().chapter;
                if (dbChap.toLowerCase().trim() === chapName.toLowerCase().trim()) {
                    potentialMatch = `"${dbChap}" (Differs by case/space?)`;
                }
            });
            console.log(`  🔎 Potential match in DB: ${potentialMatch}`);
        } else {
            console.log(`  ✅ Found ${qSnap.size}+ matches. Data exists.`);
            const d = qSnap.docs[0].data();
            console.log(`     Sample Class: "${d.class}"`);
        }
    }
}

checkMismatch().then(() => process.exit(0));
