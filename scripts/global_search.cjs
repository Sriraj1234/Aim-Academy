const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

async function globalSearch() {
    console.log("--- GLOBAL SEARCH ---");
    
    // 1. Check Root
    const rootSnap = await db.collection('questions').get();
    console.log("Root 'questions' flat count: " + rootSnap.size);

    // 2. Collection Group 'maths'
    const cgMaths = await db.collectionGroup('maths').get();
    console.log("Global 'maths' group count: " + cgMaths.size);
    if (cgMaths.size > 0) {
        console.log("Found in group 'maths' at focus path: " + cgMaths.docs[0].ref.path);
    }

    // 3. Collection Group 'mathematics'
    const cgMathematics = await db.collectionGroup('mathematics').get();
    console.log("Global 'mathematics' group count: " + cgMathematics.size);
    if (cgMathematics.size > 0) {
        console.log("Found in group 'mathematics' at focus path: " + cgMathematics.docs[0].ref.path);
    }

    // 4. Chapter Specific
    const chap = "द्विघात समीकरण";
    const chapSnap = await db.collectionGroup('maths').where('chapter', '==', chap).get();
    console.log(`Searching chapter [${chap}] in 'maths': ${chapSnap.size}`);
    
    const chapSnap2 = await db.collectionGroup('mathematics').where('chapter', '==', chap).get();
    console.log(`Searching chapter [${chap}] in 'mathematics': ${chapSnap2.size}`);

    console.log("--- SEARCH DONE ---");
}

globalSearch().catch(console.error);
