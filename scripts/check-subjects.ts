import * as admin from 'firebase-admin';
import * as path from 'path';

// Load env vars
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

async function run() {
    const subjectsFound = new Set<string>();
    const boardsSnap = await db.collection('questions').get();
    
    await Promise.all(boardsSnap.docs.map(async boardDoc => {
         const classes = await boardDoc.ref.listCollections();
         await Promise.all(classes.map(async classCol => {
             const streamsSnap = await classCol.get();
             await Promise.all(streamsSnap.docs.map(async streamDoc => {
                 const subjects = await streamDoc.ref.listCollections();
                 subjects.forEach(s => subjectsFound.add(s.id));
             }));
         }));
    }));
    
    const subjectsToScan = Array.from(subjectsFound);
    console.log("Dynamically discovered subjects:", subjectsToScan);
}

run();
