const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

try {
    const envPathLocal = path.join(__dirname, '..', '.env.local');
    const envPath = path.join(__dirname, '..', '.env');

    dotenv.config({ path: envPath });
    dotenv.config({ path: envPathLocal, override: true });

    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey && privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
    process.exit(1);
}

const db = admin.firestore();

async function checkRemaining() {
    console.log("Checking for remaining string answers...");
    const questionsRef = db.collection('questions');
    const snapshot = await questionsRef
        .where('source', '==', 'excel_upload_jan_2026')
        .select('correctAnswer') // Optimization
        .get();

    let stringCount = 0;
    let numberCount = 0;
    let otherCount = 0;

    snapshot.forEach(doc => {
        const val = doc.data().correctAnswer;
        if (typeof val === 'string') stringCount++;
        else if (typeof val === 'number') numberCount++;
        else otherCount++;
    });

    console.log(`Results:`);
    console.log(`- String: ${stringCount}`);
    console.log(`- Number: ${numberCount}`);
    console.log(`- Other : ${otherCount}`);
    console.log(`- Total : ${snapshot.size}`);

    if (stringCount > 0) {
        // Log a few examples of strings
        console.log("\nSample String Answers:");
        let logged = 0;
        for (const doc of snapshot.docs) {
            const val = doc.data().correctAnswer;
            if (typeof val === 'string') {
                console.log(`- Doc ${doc.id}: "${val}"`);
                logged++;
                if (logged >= 5) break;
            }
        }
    }
}

checkRemaining();
