const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        if (!privateKey) {
            throw new Error('FIREBASE_PRIVATE_KEY is missing in .env.local');
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log("Firebase initialized successfully.");
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
        process.exit(1);
    }
}

const db = getFirestore();

async function checkTaxonomy() {
    try {
        const docRef = db.collection('metadata').doc('taxonomy');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('Taxonomy document does not exist!');
            return;
        }

        const data = docSnap.data();
        console.log('\nTaxonomy Data Keys:', Object.keys(data));

        // Check specific keys for English
        const keysToCheck = ['bseb_12_science', 'bseb_12_arts', 'bseb_12_commerce', 'bseb_10'];

        keysToCheck.forEach(key => {
            if (data[key]) {
                console.log(`\n--- ${key} ---`);
                console.log('Subjects:', data[key].subjects);

                // Check for English (case insensitive)
                const subject = data[key].subjects.find(s => s.toLowerCase().includes('english'));
                console.log(`Contains 'English': ${!!subject} (${subject || 'N/A'})`);

                if (subject) {
                    const chapters = data[key].chapters[subject];
                    console.log(`Chapters count for '${subject}':`, chapters ? chapters.length : 'UNDEFINED');
                    if (chapters && chapters.length > 0) {
                        console.log('Sample chapter:', chapters[0]);
                    }
                } else {
                    console.log('⚠️ English subject MISSING in subjects array.');
                }
            } else {
                console.log(`\n--- ${key} ---`);
                console.log('❌ Taxonomy key not found');
            }
        });

    } catch (error) {
        console.error('Error fetching taxonomy:', error);
    }
}

checkTaxonomy();
