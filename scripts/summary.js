const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    projectId: "aim-83922",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    const docRef = doc(db, 'metadata', 'taxonomy');
    const snap = await getDoc(docRef);
    const data = snap.data();
    const key = 'bseb_10';

    // Just print count summary
    console.log("SUBJECTS:", data[key].subjects.join(", "));
    console.log("TOTAL SUBJECTS:", data[key].subjects.length);

    Object.keys(data[key].chapters).forEach(sub => {
        const chaps = data[key].chapters[sub];
        const totalQs = chaps.reduce((sum, c) => sum + c.count, 0);
        console.log(`${sub}: ${chaps.length} chapters, ${totalQs} questions`);
    });
}

main();
