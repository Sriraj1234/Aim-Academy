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

async function debugTaxonomyPaths() {
    console.log("--- DEBUGGING TAXONOMY PATHS ---");
    
    // Check root 'questions' collection
    const rootSnap = await db.collection('questions').limit(5).get();
    console.log(`Root 'questions' direct children count: ${rootSnap.size}`);
    rootSnap.forEach(doc => console.log(`  - Root direct doc ID: ${doc.id}`));

    // Check collectionGroup('questions')
    const groupSnap = await db.collectionGroup('questions').limit(10).get();
    console.log(`collectionGroup('questions') sample paths:`);
    groupSnap.forEach(doc => console.log(`  - ${doc.ref.path}`));

    // Check common subject groups
    const subjects = ['physics', 'chemistry', 'biology', 'mathematics', 'maths'];
    for (const sub of subjects) {
        const snap = await db.collectionGroup(sub).limit(1).get();
        if (!snap.empty) {
            console.log(`Found docs in group '${sub}': ${snap.docs[0].ref.path}`);
        } else {
            console.log(`Group '${sub}' is empty.`);
        }
    }
}

debugTaxonomyPaths().catch(console.error);
