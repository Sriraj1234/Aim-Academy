const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Client SDK
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function rebuild() {
    try {
        console.log("Starting Taxonomy Rebuild (Client SDK)...");

        // 1. Fetch all questions
        const questionsRef = collection(db, 'questions');
        const snapshot = await getDocs(questionsRef);
        console.log(`Fetched ${snapshot.size} questions.`);

        const taxonomy = {};

        // 2. Aggregate Data
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            let subject = (data.subject || 'general').toLowerCase().trim();
            const chapter = (data.chapter || 'general').trim();

            // board_class key (e.g., bseb_10)
            const board = (data.board || 'other').toLowerCase();
            const classLevel = (data.class || 'other').toString();
            const key = `${board}_${classLevel}`;

            if (!taxonomy[key]) {
                taxonomy[key] = {
                    subjects: new Set(),
                    chapters: {}
                };
            }

            // Normalization
            if (subject === 'math') subject = 'mathematics';

            // Add normalized subject to set
            taxonomy[key].subjects.add(subject);

            if (!taxonomy[key].chapters[subject]) {
                taxonomy[key].chapters[subject] = [];
            }

            // Check if chapter already exists in list (by name)
            const existingChap = taxonomy[key].chapters[subject].find((c) => c.name === chapter);
            if (existingChap) {
                existingChap.count++;
            } else {
                taxonomy[key].chapters[subject].push({ name: chapter, count: 1 });
            }
        });

        // 3. Convert Sets to Arrays for Firestore
        const cleanTaxonomy = {};
        Object.keys(taxonomy).forEach(key => {
            cleanTaxonomy[key] = {
                subjects: Array.from(taxonomy[key].subjects),
                chapters: taxonomy[key].chapters
            };
        });

        // 4. Update Metadata Document
        await setDoc(doc(db, 'metadata', 'taxonomy'), cleanTaxonomy);

        console.log("Taxonomy rebuilt successfully.");
        console.log(JSON.stringify(cleanTaxonomy, null, 2));

    } catch (error) {
        console.error("Taxonomy rebuild failed:", error);
    }
}

rebuild();
