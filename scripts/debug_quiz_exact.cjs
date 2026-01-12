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

async function run() {
    // 1. Get User Profile to mimic App
    const email = 'jayant.kgp81@gmail.com';
    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userSnap.empty) { console.log("User not found"); return; }
    const user = userSnap.docs[0].data();

    const rawBoard = user.board; // e.g. "BSEB"
    const lowerBoard = rawBoard.toLowerCase(); // "bseb"
    const variants = Array.from(new Set([rawBoard, lowerBoard]));

    // 2. Pick a chapter from taxonomy or just use a known one
    // Let's assume the user is clicking the first chapter found in taxonomy
    const taxSnap = await db.collection('metadata').doc('taxonomy').get();
    let chapter = "Kadbakk"; // default
    if (taxSnap.exists) {
        const tax = taxSnap.data();
        const key = `${lowerBoard}_12`;
        const chapters = tax[key]?.chapters?.['hindi'];
        if (chapters && chapters.length > 0) {
            chapter = typeof chapters[0] === 'string' ? chapters[0] : chapters[0].name;
            console.log(`Testing with first chapter from taxonomy: "${chapter}"`);
        }
    }

    console.log(`\n--- QUERY SIMULATION ---`);
    console.log(`Board IN: ${JSON.stringify(variants)}`);
    console.log(`Subject: hindi`);
    console.log(`Chapter: "${chapter}"`);

    // 3. Execute Query
    const q = db.collection('questions')
        .where('board', 'in', variants)
        .where('subject', '==', 'hindi')
        .where('chapter', '==', chapter)
        .limit(5);

    const qs = await q.get();
    console.log(`\nDocs Found: ${qs.size}`);

    if (qs.size === 0) {
        console.log("❌ ZERO RESULTS. The query is finding nothing.");
        // Debug: Try without Board constraint
        const qNoBoard = db.collection('questions').where('subject', '==', 'hindi').where('chapter', '==', chapter).limit(1);
        const s2 = await qNoBoard.get();
        if (!s2.empty) {
            console.log(`Wait! Found data WITHOUT board filter. Data has board: "${s2.docs[0].data().board}"`);
        } else {
            console.log("Found NO data even without board filter. Chapter name might be wrong?");
        }
    } else {
        qs.forEach(doc => {
            const d = doc.data();
            console.log(`\nDoc: ${doc.id}`);
            console.log(`Board: "${d.board}"`);
            console.log(`Options: ${JSON.stringify(d.options)}`);
            // Check validity
            if (!Array.isArray(d.options) || d.options.length < 2) {
                console.log("⚠️  INVALID OPTIONS!");
            } else {
                console.log("✅ Data looks good.");
            }
        });
    }
}

run().then(() => process.exit(0));
