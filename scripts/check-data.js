const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkData() {
    console.log("Checking Questions...");
    const snapshot = await db.collection('questions').limit(10).get();

    if (snapshot.empty) {
        console.log("No questions found in 'questions' collection.");
    } else {
        console.log(`Found ${snapshot.size} sample questions:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}, Subject: '${data.subject}', Chapter: '${data.chapter}'`);
        });
    }

    console.log("\nChecking Metadata...");
    const metaDoc = await db.collection('metadata').doc('taxonomy').get();
    if (!metaDoc.exists) {
        console.log("No metadata/taxonomy document found.");
    } else {
        console.log("Metadata:", JSON.stringify(metaDoc.data(), null, 2));
    }
}

checkData().catch(console.error);
