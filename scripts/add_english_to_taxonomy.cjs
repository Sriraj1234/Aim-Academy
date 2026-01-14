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
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
        process.exit(1);
    }
}

const db = getFirestore();

async function addEnglishToTaxonomy() {
    try {
        const docRef = db.collection('metadata').doc('taxonomy');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('Taxonomy document does not exist!');
            return;
        }

        const data = docSnap.data();
        let updated = false;

        // Keys to update
        const keysToUpdate = ['bseb_12_science', 'bseb_12_arts', 'bseb_12_commerce'];

        keysToUpdate.forEach(key => {
            if (data[key]) {
                const subjects = data[key].subjects || [];
                console.log(`\nChecking ${key}`);
                console.log('Current Subjects:', JSON.stringify(subjects));

                const hasEnglish = subjects.some(s => s.toLowerCase() === 'english');

                if (!hasEnglish) {
                    console.log(`ADDING English to ${key}...`);
                    data[key].subjects.push('English');
                    updated = true;
                } else {
                    console.log(`English ALREADY EXISTS in ${key} subjects.`);
                }

                // Initialize chapters if missing
                if (!data[key].chapters) data[key].chapters = {};
                if (!data[key].chapters['English']) {
                    console.log(`Initializing empty chapters for English in ${key}`);
                    data[key].chapters['English'] = [];
                    updated = true;
                }
            } else {
                console.log(`Key ${key} not found in taxonomy, skipping.`);
            }
        });

        if (updated) {
            await docRef.set(data);
            console.log('Taxonomy updated successfully!');
        } else {
            console.log('No changes needed.');
        }

    } catch (error) {
        console.error('Error updating taxonomy:', error);
    }
}

addEnglishToTaxonomy();
