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

const ENGLISH_CHAPTERS = [
    "A Child Is Born",
    "A Marriage Proposal",
    "A Pinch of Snuff",
    "An Epitaph",
    "Bharat is My Home",
    "Fire-Hymn",
    "How Free is the Press",
    "I Have a Dream",
    "Ideas That Have Helped Mankind",
    "India Through Traveller's Eye",
    "Indian Civilisation and Culture",
    "Macavity: The Mystery Cat",
    "My Grandmother’s House",
    "Now the Leaves are Falling Fast",
    "Ode to Autumn",
    "Snake",
    "Song of Myself",
    "Sweetest Love, I Do Not Go",
    "The Artist",
    "The Earth",
    "The Gardener",
    "The Soldier"
];

async function updateTaxonomy() {
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.log('Taxonomy missing!');
        return;
    }

    const data = docSnap.data();
    // Update all 3 streams
    const keys = ['bseb_12_science', 'bseb_12_arts', 'bseb_12_commerce'];

    keys.forEach(key => {
        if (!data[key]) return;

        // Ensure "English" is in subjects list
        if (!data[key].subjects.includes('English')) {
            console.log(`Adding English subject to ${key}`);
            data[key].subjects.push('English');
        }

        // Initialize chapters obj if missing
        if (!data[key].chapters) data[key].chapters = {};

        // Set the English chapters
        console.log(`Updating English chapters for ${key}`);
        data[key].chapters['English'] = ENGLISH_CHAPTERS;
    });

    await docRef.set(data);
    console.log('Successfully updated taxonomy with real English chapters.');
}

updateTaxonomy();
