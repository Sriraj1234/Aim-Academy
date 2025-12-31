const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, query, where } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    projectId: "aim-83922",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    console.log("Deleting old SST questions (BSEB Class 10, SST subjects only)...");

    const sstSubjects = ['geography', 'economics', 'history', 'political science', 'disaster management', 'social science'];

    const qCol = collection(db, 'questions');
    const qQuery = query(qCol, where('board', '==', 'bseb'), where('class', '==', '10'));

    const snapshot = await getDocs(qQuery);
    console.log(`Found ${snapshot.size} BSEB Class 10 questions total.`);

    let deleted = 0;
    for (const doc of snapshot.docs) {
        const sub = (doc.data().subject || '').toLowerCase();
        if (sstSubjects.includes(sub)) {
            await deleteDoc(doc.ref);
            deleted++;
            if (deleted % 100 === 0) {
                process.stdout.write(`\rDeleted: ${deleted}`);
            }
        }
    }

    console.log(`\nDone! Deleted ${deleted} SST questions.`);
}

main().catch(console.error);
