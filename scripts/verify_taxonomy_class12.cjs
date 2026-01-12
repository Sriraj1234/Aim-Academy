const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
    console.log("Verifying taxonomy...");
    const docRef = doc(db, 'metadata', 'taxonomy');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
        const data = snap.data();
        const expectedKeys = ['bseb_12_science', 'bseb_12_commerce', 'bseb_12_arts'];

        let allFound = true;
        for (const key of expectedKeys) {
            if (data[key]) {
                console.log(`✅ Found key: ${key}`);
                const subjects = data[key].subjects;
                console.log(`   Subjects: ${subjects.join(', ')}`);
                if (!subjects.includes('Hindi') || !subjects.includes('English')) {
                    console.error('   ❌ Missing Hindi or English!');
                    allFound = false;
                }
            } else {
                console.error(`❌ Missing key: ${key}`);
                allFound = false;
            }
        }

        if (allFound) {
            console.log("ALL CHECKS PASSED");
        }
    } else {
        console.error("Taxonomy document not found!");
    }
    process.exit(0);
}

verify();
