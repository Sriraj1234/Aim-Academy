const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const fs = require('fs');

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

    let output = [];
    output.push("=== BSEB CLASS 10 TAXONOMY ===\n");
    output.push("SUBJECTS: " + data[key].subjects.join(", "));
    output.push("TOTAL: " + data[key].subjects.length + " subjects\n");

    Object.keys(data[key].chapters).forEach(sub => {
        const chaps = data[key].chapters[sub];
        const totalQs = chaps.reduce((sum, c) => sum + c.count, 0);
        output.push(`\n${sub.toUpperCase()}: ${chaps.length} chapters, ${totalQs} questions`);
        chaps.forEach(c => output.push(`  - ${c.name}: ${c.count} Qs`));
    });

    fs.writeFileSync('taxonomy_report.txt', output.join('\n'), 'utf8');
    console.log("Report saved to taxonomy_report.txt");
}

main();
