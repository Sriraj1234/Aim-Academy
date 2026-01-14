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

// --- DATA DEFINITIONS ---

const ENGLISH_PROSE = [
    "Indian Civilisation and Culture", "Bharat is My Home", "A Pinch of Snuff",
    "I Have a Dream", "Ideas That Have Helped Mankind", "The Artist",
    "A Child Is Born", "How Free is the Press", "The Earth",
    "India Through Traveller's Eye", "A Marriage Proposal"
];

const ENGLISH_POETRY = [
    "Sweetest Love, I Do Not Go", "Song of Myself", "Now the Leaves are Falling Fast",
    "Ode to Autumn", "An Epitaph", "The Soldier", "Macavity: The Mystery Cat",
    "Fire-Hymn", "Snake", "My Grandmother’s House"
];

const HINDI_GADYA = [
    "बातचीत", "उसने कहा था", "सम्पूर्ण क्रांति", "अर्धनारीश्वर",
    "रोज़", "एक लेख और एक पत्र", "ओ सदानीरा", "सिपाही की माँ",
    "प्रगीत और समाज", "जूठन", "हँसते हुए मेरा अकेलापन", "तिरिछ", "शिक्षा"
];

const HINDI_PADYA = [
    "कड़बक", "सूरदास के पद", "पद (तुलसीदास)", "छप्पय", "कवित्त",
    "तुमुल कोलाहल कलह में", "पुत्र वियोग", "उषा", "जन-जन का चेहरा एक",
    "10. अधिनायक", "प्यारे नन्हें बेटे को", "हार-जीत", "गाँव का घर"
];

async function rebuildTaxonomy() {
    console.log('Rebuilding Taxonomy for Stream Independence & Organization...');
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) return;

    const data = docSnap.data();
    const streams = ['bseb_12_science', 'bseb_12_arts', 'bseb_12_commerce'];

    streams.forEach(key => {
        if (!data[key]) return;

        console.log(`Processing ${key}...`);

        // 1. Clean up old generic subjects
        data[key].subjects = data[key].subjects.filter(s =>
            s !== 'English' && s !== 'Hindi' &&
            !s.includes('Prose') && !s.includes('Poetry') && !s.includes('Gadya') && !s.includes('Padya')
        );

        // 2. Add Organized Subjects
        data[key].subjects.push('English Prose', 'English Poetry', 'Hindi Gadya', 'Hindi Padya');

        // 3. Update Chapters
        if (!data[key].chapters) data[key].chapters = {};

        // Remove old keys to avoid clutter (optional but good)
        delete data[key].chapters['English'];
        delete data[key].chapters['Hindi'];

        data[key].chapters['English Prose'] = ENGLISH_PROSE;
        data[key].chapters['English Poetry'] = ENGLISH_POETRY;
        data[key].chapters['Hindi Gadya'] = HINDI_GADYA;
        data[key].chapters['Hindi Padya'] = HINDI_PADYA;
    });

    await docRef.set(data);
    console.log('Taxonomy Rebuilt Successfully!');
}

rebuildTaxonomy();
