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

async function findMaths() {
    console.log("--- SEARCHING FOR ANY MATHS QUESTIONS ---");
    
    // Search collectionGroup for anything related to maths/mathematics
    const groupMaths = await db.collectionGroup('maths').limit(10).get();
    const groupMathematics = await db.collectionGroup('mathematics').limit(10).get();
    
    console.log(`Global 'maths' group count (limited to 10): ${groupMaths.size}`);
    if (groupMaths.size > 0) {
        groupMaths.forEach(doc => console.log(`  - Found at: ${doc.ref.path}`));
    }

    console.log(`Global 'mathematics' group count (limited to 10): ${groupMathematics.size}`);
    if (groupMathematics.size > 0) {
        groupMathematics.forEach(doc => console.log(`  - Found at: ${doc.ref.path}`));
    }

    // Check specifically for Class 10 Maths in BSEB (Capitalized)
    const bsebMaths = await db.collection('questions/BSEB/Class 10/general/maths').limit(1).get();
    const bsebMathematics = await db.collection('questions/BSEB/Class 10/general/mathematics').limit(1).get();
    
    console.log(`BSEB Class 10 Maths Check:`);
    console.log(`  - questions/BSEB/Class 10/general/maths: ${bsebMaths.size}`);
    console.log(`  - questions/BSEB/Class 10/general/mathematics: ${bsebMathematics.size}`);

    console.log("--- SEARCH DONE ---");
}

findMaths().catch(console.error);
