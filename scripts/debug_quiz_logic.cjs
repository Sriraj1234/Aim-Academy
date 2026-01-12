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

async function testLogic() {
    console.log("--- DEBUGGING QUIZ LOGIC ---");

    // User Profile Simulation
    const userClass = "12 Science";
    const normUserClass = userClass.toLowerCase().replace('th', '').trim().split(' ')[0]; // "12"
    console.log(`User Class: "${userClass}" -> Normalized: "${normUserClass}"`);

    // Fetch ONE question
    const subject = "hindi";
    // We need a chapter that definitely exists.
    // Let's first fetch ANY hindi question to get a valid chapter
    const sampleSnap = await db.collection('questions')
        .where('subject', '==', subject)
        .limit(1).get();

    if (sampleSnap.empty) {
        console.log("❌ NO HINDI QUESTIONS FOUND AT ALL.");
        return;
    }

    const sampleDoc = sampleSnap.docs[0];
    const chapter = sampleDoc.data().chapter;
    console.log(`Using Chapter: "${chapter}"`);

    // Now run the query exactly as QuizContext does (assuming I removed class constraint)
    const qSnapshot = await db.collection('questions')
        .where('board', '==', 'BSEB')
        .where('subject', '==', subject)
        .where('chapter', '==', chapter)
        .limit(5)
        .get();

    console.log(`Firestore Query returned ${qSnapshot.size} docs.`);

    let passedFilter = 0;
    qSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\nDoc ID: ${doc.id}`);
        console.log(` - Class: "${data.class}" (Type: ${typeof data.class})`);
        console.log(` - Options: ${Array.isArray(data.options) ? `Array[${data.options.length}]` : typeof data.options}`);
        if (Array.isArray(data.options)) console.log(`   - ${JSON.stringify(data.options)}`);

        // Run Filter Logic
        const qClass = (data.class || '').toString();
        const normQClass = qClass.toLowerCase().replace('th', '').trim().split(' ')[0];
        console.log(` - Norm QClass: "${normQClass}"`);

        if (normUserClass === normQClass) {
            console.log(" ✅ FILTER PASSED");
            passedFilter++;
        } else {
            console.log(" ❌ FILTER FAILED");
        }
    });

    console.log(`\nSummary: ${passedFilter} / ${qSnapshot.size} passed the logic.`);
}

testLogic().then(() => process.exit(0));
