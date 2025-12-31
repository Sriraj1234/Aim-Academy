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

    if (!snap.exists()) {
        console.log("NO TAXONOMY FOUND");
        return;
    }

    const data = snap.data();
    const key = 'bseb_10';

    if (!data[key]) {
        console.log("KEY bseb_10 NOT FOUND");
        return;
    }

    console.log("=== SUBJECTS FOR BSEB CLASS 10 ===");
    data[key].subjects.forEach((s, i) => console.log(`${i + 1}. ${s}`));

    console.log("\n=== CHAPTERS PER SUBJECT ===");
    Object.keys(data[key].chapters).forEach(sub => {
        const chaps = data[key].chapters[sub];
        console.log(`\n${sub.toUpperCase()} (${chaps.length} chapters):`);
        chaps.forEach(c => console.log(`  - ${c.name}: ${c.count} Qs`));
    });
}

main().catch(console.error);
