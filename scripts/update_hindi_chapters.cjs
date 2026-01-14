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

// Standard BSEB 12th Hindi Chapters (Digant Part 2)
const HINDI_CHAPTERS = [
    // Gadya Khand (Prose)
    "Batcheet",
    "Usne Kaha Tha",
    "Sampoorna Kranti",
    "Ardhnaarishwar",
    "Roz",
    "Ek Lekh Aur Ek Patra",
    "O Sadanira",
    "Sipahi Ki Maa",
    "Pragit Aur Samaj",
    "Joothan",
    "Haste Hue Mera Akelapan",
    "Tirich",
    "Shiksha",

    // Padya Khand (Poetry)
    "Kadbakk",
    "Pad (Surdas)",
    "Pad (Tulsidas)",
    "Chhappay",
    "Kavit",
    "Tumul Kolahal kalah Mein",
    "Putra Viyog",
    "Usha",
    "Jan Jan Ka Chehra Ek",
    "Adhinayak",
    "Pyare Nanhe Bete Ko",
    "Haar Jeet",
    "Gaon Ka Ghar"
];

async function updateHindiTaxonomy() {
    console.log('Updating Hindi taxonomy with standard chapters...');
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.log('Taxonomy missing!');
        return;
    }

    const data = docSnap.data();
    const keys = ['bseb_12_science', 'bseb_12_arts', 'bseb_12_commerce'];

    keys.forEach(key => {
        if (!data[key]) return;

        // Ensure "Hindi" is in subjects list
        if (!data[key].subjects.includes('Hindi')) {
            console.log(`Adding Hindi subject to ${key}`);
            data[key].subjects.push('Hindi');
        }

        if (!data[key].chapters) data[key].chapters = {};

        console.log(`Updating chapters for ${key}`);
        data[key].chapters['Hindi'] = HINDI_CHAPTERS;
    });

    await docRef.set(data);
    console.log('Successfully updated taxonomy for Hindi.');
}

updateHindiTaxonomy();
