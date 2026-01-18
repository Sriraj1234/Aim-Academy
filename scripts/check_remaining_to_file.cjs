const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

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
    console.log("Checking...");
    const questionsRef = db.collection('questions');
    const snapshot = await questionsRef
        .where('source', '==', 'excel_upload_jan_2026')
        .select('correctAnswer')
        .get();

    let stringCount = 0;
    let numberCount = 0;
    const errors = [];

    snapshot.forEach(doc => {
        const val = doc.data().correctAnswer;
        if (typeof val === 'string') {
            stringCount++;
            if (errors.length < 50) {
                errors.push(`Doc ${doc.id}: "${val}"`);
            }
        }
        else if (typeof val === 'number') numberCount++;
    });

    const report = `
Results:
- String: ${stringCount}
- Number: ${numberCount}
- Total : ${snapshot.size}

Samples:
${errors.join('\n')}
    `;

    fs.writeFileSync('remaining_errors.txt', report);
    console.log("Report saved to remaining_errors.txt");
}

checkRemaining();
