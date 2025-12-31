const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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
    console.log("Reading metadata...");
    const ref = doc(db, 'metadata', 'taxonomy');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        console.error("No metadata found!");
        return;
    }

    const data = snap.data();
    Object.keys(data).forEach(key => {
        if (key.includes('10')) { // Focus on Class 10
            const subjects = data[key].chapters || {};
            Object.keys(subjects).forEach(sub => {
                if (sub.includes('hindi')) {
                    console.log(`\n--- SUBJECT: ${sub} ---`);
                    const chapters = subjects[sub];
                    chapters.forEach((c, i) => {
                        console.log(`[${i}] "${c.name}" (Count: ${c.count})`);
                    });
                }
            });
        }
    });
    process.exit(0);
}

main();
