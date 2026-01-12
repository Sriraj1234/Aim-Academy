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

async function testEncoding() {
    console.log("--- DEBUGGING HINDI URL ENCODING ISSUES ---");

    // 1. Get a Real Hindi Chapter Name from DB
    const qSnap = await db.collection('questions')
        .where('subject', '==', 'hindi')
        .limit(1)
        .get();

    if (qSnap.empty) { console.log("No Hindi questions found."); return; }

    const realChapterName = qSnap.docs[0].data().chapter;
    console.log(`Real Chapter Name in DB:  "${realChapterName}"`);
    console.log(`Hex Dump:                 ${Buffer.from(realChapterName).toString('hex')}`);

    // 2. Simulate URL Encoding (what the browser does)
    const urlEncoded = encodeURIComponent(realChapterName);
    console.log(`URL Encoded:              ${urlEncoded}`);

    // 3. Simulate App Decoding (what QuizContext receives)
    const appDecoded = decodeURIComponent(urlEncoded);
    console.log(`App Decoded:              "${appDecoded}"`);

    const doubleDecoded = decodeURIComponent(appDecoded); // In case it was double encoded?
    console.log(`Double Decoded:           "${doubleDecoded}"`);

    // 4. Test Query with each variant
    console.log("\n--- TESTING FIRESTORE QUERIES ---");

    async function tryQuery(name, label) {
        const snap = await db.collection('questions')
            .where('subject', '==', 'hindi')
            .where('chapter', '==', name)
            .limit(1)
            .get();
        console.log(`Query using [${label}] ("${name}") -> found ${snap.size} docs.`);
    }

    await tryQuery(realChapterName, "Original");
    await tryQuery(appDecoded, "Decoded");

    // Test for common whitespace issues
    await tryQuery(realChapterName.trim(), "Trimmed Original");

    // Check if there's a mismatch between 'startQuiz' input and DB
    if (realChapterName !== realChapterName.trim()) {
        console.warn("\n⚠️ WARNING: DB value has leading/trailing spaces! user click might send trimmed value.");
    }
}

testEncoding().then(() => process.exit(0));
