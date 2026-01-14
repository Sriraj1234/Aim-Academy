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

async function checkEnglishQuestion() {
    console.log('Searching for one English question...');
    // Try to find ANY question with subject 'English' (case insensitive search not easy in firestore without index, so we do client side filter on small batch)

    // We'll fetch a batch of questions where class is '12'
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
        if (data.subject && data.subject.toLowerCase() === 'english') {
            console.log('\n--- FOUND ENGLISH QUESTION ---');
            console.log('ID:', doc.id);
            console.log('Board:', data.board);
            console.log('Class:', data.class);
            console.log('Subject (RAW):', data.subject);
            console.log('Stream (if any):', data.stream);
            console.log('Chapter:', data.chapter);
            found = true;
        }
    });

    if (!found) {
        console.log('Fetched 50 Class 12 questions but none were English.');
        // Try searching for Hindi as well
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.subject && data.subject.toLowerCase() === 'hindi') {
                console.log('\n--- FOUND HINDI QUESTION ---');
                console.log('ID:', doc.id);
                console.log('Board:', data.board);
                console.log('Class:', data.class);
                console.log('Subject (RAW):', data.subject);
                console.log('Stream (if any):', data.stream);
                console.log('Chapter:', data.chapter);
                found = true;
            }
        });
    }
}

checkEnglishQuestion();
