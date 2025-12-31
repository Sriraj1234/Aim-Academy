const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, query, where } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "134379665002",
    appId: "1:134379665002:web:34f8abf08f3c3655967c13",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    console.log("Starting Metadata Update...");

    // We want to rebuild metadata specifically for BSEB Class 10
    const qCol = collection(db, 'questions');
    const qQuery = query(qCol, where('board', '==', 'bseb'), where('class', '==', '10'));

    console.log("Fetching questions for BSEB Class 10...");
    const snapshot = await getDocs(qQuery);
    console.log(`Found ${snapshot.size} questions.`);

    if (snapshot.empty) {
        console.log("No questions found. Exiting.");
        return;
    }

    const taxonomy = {
        subjects: new Set(),
        chapters: {}
    };

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        let sub = (data.subject || 'unknown').toLowerCase();
        let chap = (data.chapter || 'general').trim();

        // Normalize Subject
        if (sub === 'sst' || sub.includes('social')) sub = 'social science';

        // Add to Set
        taxonomy.subjects.add(sub);

        // Initialize Chapter Array
        if (!taxonomy.chapters[sub]) taxonomy.chapters[sub] = {};

        // Count Chapter
        if (!taxonomy.chapters[sub][chap]) taxonomy.chapters[sub][chap] = 0;
        taxonomy.chapters[sub][chap]++;
    });

    // Format for Firestore
    const finalData = {
        subjects: Array.from(taxonomy.subjects),
        chapters: {}
    };

    // Convert chapter counts to array of objects { name, count }
    Object.keys(taxonomy.chapters).forEach(sub => {
        finalData.chapters[sub] = Object.keys(taxonomy.chapters[sub]).map(chap => ({
            name: chap,
            count: taxonomy.chapters[sub][chap]
        }));
    });

    console.log("Constructed Taxonomy:", JSON.stringify(finalData, null, 2));

    // Update Firestore
    const metaRef = doc(db, 'metadata', 'taxonomy');

    // We need to merge this with existing data, assuming existing data might have other boards
    // But for this key 'bseb_10', we overwrite.

    const key = 'bseb_10';

    try {
        // Read existing first to preserve other boards
        const existingSnap = await (await require('firebase/firestore').getDoc(metaRef));
        let existingData = existingSnap.exists() ? existingSnap.data() : {};

        existingData[key] = finalData;

        await setDoc(metaRef, existingData);
        console.log(`SUCCESS! Updated metadata/taxonomy for key '${key}'`);
    } catch (e) {
        console.error("Update Failed:", e);
    }
}

main();
