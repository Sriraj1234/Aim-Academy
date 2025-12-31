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

async function verify() {
    try {
        const docRef = doc(db, 'metadata', 'taxonomy');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Taxonomy keys:", Object.keys(data));
            if (data.bseb_10) {
                console.log("BSEB Class 10 Subjects:", data.bseb_10.subjects);
            }
        } else {
            console.log("No taxonomy found!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
    // Force exit as the Firebase app keeps the process alive
    process.exit(0);
}

verify();
