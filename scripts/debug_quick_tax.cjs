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

async function checkKey() {
    const doc = await db.collection('metadata').doc('taxonomy').get();
    if (doc.exists) {
        const data = doc.data();
        if (data['bseb_12']) {
            console.log("Subjects:", JSON.stringify(data['bseb_12'].subjects));
            // Check hindi chapters
            const chapters = data['bseb_12'].chapters['hindi'];
            if (chapters) {
                console.log(`Found ${chapters.length} Hindi chapters.`);
                console.log("First 3 Chapters:", JSON.stringify(chapters.slice(0, 3), null, 2));
            } else {
                console.log("No 'hindi' chapters found in taxonomy!");
            }
        } else {
            console.log("bseb_12 key MISSING");
        }
    } else {
        console.log("Taxonomy doc missing");
    }
}

checkKey().then(() => process.exit(0));
