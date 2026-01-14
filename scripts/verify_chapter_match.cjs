const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
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

const CHAPTERS_TO_CHECK = {
    "English": [
        "Indian Civilisation and Culture", "Bharat is My Home", "A Pinch of Snuff",
        "I Have a Dream", "Ideas That Have Helped Mankind", "The Artist",
        "A Child Is Born", "How Free is the Press", "The Earth",
        "India Through Traveller's Eye", "A Marriage Proposal",
        "Sweetest Love, I Do Not Go", "Song of Myself", "Now the Leaves are Falling Fast",
        "Ode to Autumn", "An Epitaph", "The Soldier", "Macavity: The Mystery Cat",
        "Fire-Hymn", "Snake", "My Grandmother’s House"
    ],
    "Hindi": [
        "बातचीत", "उसने कहा था", "सम्पूर्ण क्रांति", "अर्धनारीश्वर",
        "रोज़", "एक लेख और एक पत्र", "ओ सदानीरा", "सिपाही की माँ",
        "प्रगीत और समाज", "जूठन", "हँसते हुए मेरा अकेलापन", "तिरिछ", "शिक्षा",
        "कड़बक", "सूरदास के पद", "पद (तुलसीदास)", "छप्पय", "कवित्त",
        "तुमुल कोलाहल कलह में", "पुत्र वियोग", "उषा", "जन-जन का चेहरा एक",
        "अधिनायक", "प्यारे नन्हें बेटे को", "हार-जीत", "गाँव का घर"
    ]
};

async function verifyChapters() {
    console.log('Verifying exact chapter matches in DB...');

    // Fetch all English questions first
    console.log('Fetching ALL Class 12 English questions...');
    const engSnap = await db.collection('questions')
        .where('class', '==', '12')
        .where('subject', '==', 'English')
        .get();

    const engChapters = new Set();
    engSnap.forEach(doc => engChapters.add(doc.data().chapter));
    console.log(`Found ${engChapters.size} unique English chapters in DB.`);

    // Fetch all Hindi questions
    console.log('Fetching ALL Class 12 Hindi questions...');
    const hinSnap = await db.collection('questions')
        .where('class', '==', '12')
        .where('subject', '==', 'hindi') // Lowercase check
        // .where('subject', 'in', ['Hindi', 'hindi'])
        .get();

    const hinChapters = new Set();
    hinSnap.forEach(doc => hinChapters.add(doc.data().chapter));
    console.log(`Found ${hinChapters.size} unique Hindi chapters in DB.`);

    const report = { matches: [], mismatches: [] };

    // Check English
    CHAPTERS_TO_CHECK.English.forEach(ch => {
        if (engChapters.has(ch)) {
            report.matches.push({ subject: 'English', chapter: ch });
        } else {
            const fuzzy = Array.from(engChapters).find(c => c && c.toLowerCase() === ch.toLowerCase());
            report.mismatches.push({ subject: 'English', expected: ch, found: fuzzy || 'NOT FOUND' });
        }
    });

    // Check Hindi
    CHAPTERS_TO_CHECK.Hindi.forEach(ch => {
        if (hinChapters.has(ch)) {
            report.matches.push({ subject: 'Hindi', chapter: ch });
        } else {
            // Check substrings for Hindi to catch "10. अधिनायक" vs "अधिनायक"
            const fuzzy = Array.from(hinChapters).find(c => c && (c.includes(ch) || ch.includes(c)));
            report.mismatches.push({ subject: 'Hindi', expected: ch, found: fuzzy || 'NOT FOUND' });
        }
    });

    fs.writeFileSync(path.join(__dirname, 'chapter_mismatch_report.json'), JSON.stringify(report, null, 2));
    console.log('Report written to chapter_mismatch_report.json');
}

verifyChapters();
