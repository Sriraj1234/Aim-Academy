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

async function inspectTaxonomy() {
    try {
        const docRef = doc(db, 'metadata', 'taxonomy');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Taxonomy Keys:", Object.keys(data));

            ['bseb_12_science', 'bseb_12_commerce', 'bseb_12_arts', 'bseb_10'].forEach(key => {
                if (data[key]) {
                    console.log(`\n--- ${key} ---`);
                    console.log("Subjects:", data[key].subjects);
                } else {
                    console.log(`\n--- ${key} ---\n(Not Found)`);
                }
            });
        } else {
            console.log("No taxonomy document found!");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectTaxonomy();
