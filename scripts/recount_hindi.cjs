const fs = require('fs');
const path = require('path');

const RAW_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'final_counts_json.txt'), 'utf8'));

// Hindi Script Mapping
const PROSE_SET = new Set([
    "बातचीत", "उसने कहा था", "सम्पूर्ण क्रांति", "अर्धनारीश्वर",
    "रोज़", "एक लेख और एक पत्र", "ओ सदानीरा", "सिपाही की माँ",
    "प्रगीत और समाज", "जूठन", "हँसते हुए मेरा अकेलापन", "तिरिछ", "शिक्षा"
]);

const POETRY_SET = new Set([
    "कड़बक", "सूरदास के पद", "पद (तुलसीदास)", "छप्पय", "कवित्त",
    "तुमुल कोलाहल कलह में", "पुत्र वियोग", "उषा", "जन-जन का चेहरा एक",
    "10. अधिनायक", "अधिनायक", "प्यारे नन्हें बेटे को", "हार-जीत", "गाँव का घर"
]);

async function recountHindi() {
    // In a real script we'd query DB again, but we can't easily query by unicode list in one go.
    // However, I just need to know the breakdown of the 3524 questions.
    // Since I don't have the per-chapter counts in the JSON (only the list of names),
    // I effectively need to query the DB *grouped by chapter* to sum them up.

    // Actually, asking the database for counts per chapter is better.

    const admin = require('firebase-admin');
    const { getFirestore } = require('firebase-admin/firestore');
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

    console.log('Fetching all Hindi docs to categorize by Unicode Chapter...');
    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        // Filter in memory for subject 'hindi' to be safe
        .get();

    let proseCount = 0;
    let poetryCount = 0;
    let otherCount = 0;

    snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.subject || d.subject.toLowerCase() !== 'hindi') return;

        const ch = (d.chapter || '').trim();
        if (PROSE_SET.has(ch)) proseCount++;
        else if (POETRY_SET.has(ch)) poetryCount++;
        else otherCount++;
    });

    console.log(`\n--- HINDI RECOUNT ---`);
    console.log(`Prose (Gadya): ${proseCount}`);
    console.log(`Poetry (Padya): ${poetryCount}`);
    console.log(`Other: ${otherCount}`);
}

recountHindi();
