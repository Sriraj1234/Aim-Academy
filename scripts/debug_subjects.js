const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');

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

async function debugSubjects() {
    console.log("Debugging SST Subjects...");

    // We'll broaden the search to find *anything* aimed at these topics
    // to see exactly what fields they have.
    const subjectsToTest = ['geography', 'history', 'civics', 'political science', 'sst', 'social science'];

    for (const sub of subjectsToTest) {
        console.log(`\n--- Checking Subject: '${sub}' ---`);
        const q = query(
            collection(db, "questions"),
            where('subject', '==', sub),
            limit(3)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No documents found.");
        } else {
            snapshot.forEach(doc => {
                const d = doc.data();
                console.log(`[ID: ${doc.id}]`);
                console.log(`  Board: '${d.board}'`);
                console.log(`  Class: '${d.class}' (Type: ${typeof d.class})`);
                console.log(`  Subject: '${d.subject}'`);
                console.log(`  Chapter: '${d.chapter}'`);
            });
        }
    }
    process.exit(0);
}

debugSubjects();
