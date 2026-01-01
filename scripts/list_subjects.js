const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function listAllSubjects() {
    console.log("Scanning ALL questions for Subject Case Analysis...");
    const querySnapshot = await getDocs(collection(db, "questions"));
    const subjects = new Set();
    const subjectExamples = {}; // Store one full doc example per subject

    querySnapshot.forEach((doc) => {
        const d = doc.data();
        const sub = d.subject; // Raw value
        if (sub) {
            subjects.add(sub);
            if (!subjectExamples[sub]) {
                subjectExamples[sub] = {
                    board: d.board,
                    class: d.class,
                    chapter: d.chapter
                };
            }
        }
    });

    console.log("\nUnique Subjects Found:");
    subjects.forEach(s => {
        console.log(`- '${s}'`);
        console.log(`   Example: Board=${subjectExamples[s].board}, Class=${subjectExamples[s].class}, Chapter='${subjectExamples[s].chapter}'`);
    });
    process.exit(0);
}

listAllSubjects();
