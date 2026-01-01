const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');

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

async function normalizeDB() {
    console.log("Starting DB Normalization...");
    const qSnapshot = await getDocs(collection(db, "questions"));
    console.log(`Found ${qSnapshot.size} documents.`);

    const batchSize = 400;
    let batch = writeBatch(db);
    let count = 0;
    let totalUpdated = 0;

    qSnapshot.docs.forEach((d) => {
        const data = d.data();
        let needsUpdate = false;
        const updates = {};

        // 1. Normalize Subject
        if (data.subject && data.subject !== data.subject.toLowerCase().trim()) {
            updates.subject = data.subject.toLowerCase().trim();
            needsUpdate = true;
        }

        // 2. Normalize Board
        if (data.board && data.board !== data.board.toLowerCase().trim()) {
            updates.board = data.board.toLowerCase().trim();
            needsUpdate = true;
        }

        // 3. Normalize Class
        if (data.class) {
            const clsStr = String(data.class).trim();
            if (data.class !== clsStr) {
                updates.class = clsStr;
                needsUpdate = true;
            }
        }

        // 4. Normalize Chapter (Trim only)
        if (data.chapter && data.chapter !== data.chapter.trim()) {
            updates.chapter = data.chapter.trim();
            needsUpdate = true;
        }

        if (needsUpdate) {
            batch.update(d.ref, updates);
            count++;
            totalUpdated++;
        }

        if (count >= batchSize) {
            batch.commit();
            console.log(`Committed batch of ${count} updates...`);
            batch = writeBatch(db);
            count = 0;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${count} updates.`);
    }

    console.log(`Normalization Complete. Updated ${totalUpdated} documents.`);
    process.exit(0);
}

normalizeDB();
