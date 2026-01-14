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

// --- CATEGORIZATION MAPS ---

const ENGLISH_PROSE = [
    "Indian Civilisation and Culture", "Bharat is My Home", "A Pinch of Snuff",
    "I Have a Dream", "Ideas That Have Helped Mankind", "The Artist",
    "A Child Is Born", "How Free is the Press", "The Earth",
    "India Through Traveller's Eye", "A Marriage Proposal",
    // Catch varying spellings/titles if necessary
    "Indian Civilization and Culture"
];

const ENGLISH_POETRY = [
    "Sweetest Love, I Do Not Go", "Song of Myself", "Now the Leaves are Falling Fast",
    "Ode to Autumn", "An Epitaph", "The Soldier", "Macavity: The Mystery Cat",
    "Fire-Hymn", "Snake", "My Grandmother’s House", "My Grandmother's House"
];

const HINDI_PROSE = [
    "Batcheet", "Usne Kaha Tha", "Sampoorna Kranti", "Ardhnaarishwar",
    "Roz", "Ek Lekh Aur Ek Patra", "O Sadanira", "Sipahi Ki Maa",
    "Pragit Aur Samaj", "Joothan", "Haste Hue Mera Akelapan", "Tirich", "Shiksha"
];

const HINDI_POETRY = [
    "Kadbakk", "Pad (Surdas)", "Pad (Tulsidas)", "Chhappay", "Kavit",
    "Tumul Kolahal kalah Mein", "Putra Viyog", "Usha", "Jan Jan Ka Chehra Ek",
    "Adhinayak", "Pyare Nanhe Bete Ko", "Haar Jeet", "Gaon Ka Ghar"
];

function categorize(subject, chapter) {
    if (!chapter) return 'Unknown';
    const ch = chapter.trim().toLowerCase();

    if (subject === 'English') {
        if (ENGLISH_PROSE.some(p => p.toLowerCase() === ch)) return 'Prose';
        if (ENGLISH_POETRY.some(p => p.toLowerCase() === ch)) return 'Poetry';
    } else if (subject === 'Hindi') {
        if (HINDI_PROSE.some(p => p.toLowerCase() === ch)) return 'Prose (Gadya)';
        if (HINDI_POETRY.some(p => p.toLowerCase() === ch)) return 'Poetry (Padya)';
    }
    return 'Uncategorized';
}

async function countProsePoetry() {
    console.log('Fetching questions (Class 12, any board)...');
    const snapshot = await db.collection('questions')
        .where('class', '==', '12')
        // .where('board', '==', 'bseb') // REMOVED to catch 'BSEB'
        .get();

    const stats = {
        English: { Prose: 0, Poetry: 0, Uncategorized: 0, Total: 0 },
        Hindi: { 'Prose (Gadya)': 0, 'Poetry (Padya)': 0, Uncategorized: 0, Total: 0 }
    };

    let englishUncat = new Set();
    let hindiUncat = new Set();

    let allSubjects = new Set();

    snapshot.forEach(doc => {
        const data = doc.data();

        // Filter for BSEB (case insensitive)
        if (!data.board || data.board.toLowerCase() !== 'bseb') return;

        let sub = data.subject || 'Unknown';
        allSubjects.add(sub); // captured above

        // Debug Log for every doc (limit to first 10 for noise)
        // if (stats.Hindi.Total < 5 && sub.toLowerCase().includes('hindi')) console.log('DEBUG First 5 Hindi:', sub, data.chapter);

        // Normalize subject
        if (sub.toLowerCase().includes('english')) sub = 'English';
        else if (sub.toLowerCase() === 'hindi') sub = 'Hindi'; // Explicitly catch lowercase hindi
        else if (sub.toLowerCase().includes('hindi')) sub = 'Hindi';
        else return; // Skip other subjects

        const category = categorize(sub, data.chapter);

        if (stats[sub][category] !== undefined) {
            stats[sub][category]++;
        } else {
            // Should not happen with logic above but safe fallback
            stats[sub]['Uncategorized']++;
        }
        stats[sub].Total++;

        if (category === 'Uncategorized') {
            if (sub === 'English') englishUncat.add(data.chapter);
            if (sub === 'Hindi') hindiUncat.add(data.chapter);
        }
    });

    // console.log('\n--- DEBUG: ALL SUBJECTS FOUND ---');
    // console.log(Array.from(allSubjects));

    // console.log('\n========= REPORT =========');

    /*
    console.log('\n--- ENGLISH ---');
    console.log(`Total Questions: ${stats.English.Total}`);
    console.log(`Prose: ${stats.English.Prose}`);
    console.log(`Poetry: ${stats.English.Poetry}`);
    console.log(`Uncategorized: ${stats.English.Uncategorized}`);
    if (englishUncat.size > 0) console.log('Uncategorized Chapters:', Array.from(englishUncat));
    */

    const fs = require('fs');
    const reportPath = path.join(__dirname, 'final_counts_json.txt');

    const report = {
        stats: stats,
        uncategorized: {
            English: Array.from(englishUncat),
            Hindi: Array.from(hindiUncat)
        }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('Report written to final_counts_json.txt');
}

countProsePoetry();
