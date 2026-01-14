const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    } catch (error) { console.error(error); process.exit(1); }
}

const db = getFirestore();

async function checkPhysicsQuestion() {
    console.log('Searching for one Physics question...');
    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        .limit(50)
        .get();

    if (snapshot.empty) {
        console.log('No Class 12 questions found at all.');
        return;
    }

    let found = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.subject && data.subject.toLowerCase() === 'physics') {
            console.log('\n--- FOUND PHYSICS QUESTION ---');
            console.log('ID:', doc.id);
            console.log('Subject (RAW):', data.subject);
            found = true;
        }
    });
}
checkPhysicsQuestion();
