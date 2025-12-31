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
    try {
        console.log("Checking metadata/taxonomy...");
        const docRef = doc(db, 'metadata', 'taxonomy');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Full Taxonomy Keys:", Object.keys(data));

            const targetKey = 'bseb_10';
            if (data[targetKey]) {
                console.log(`\nData for '${targetKey}':`);
                console.log("Subjects Found:", JSON.stringify(data[targetKey].subjects));
            } else {
                console.log(`\nKEY '${targetKey}' NOT FOUND!`);
            }
        } else {
            console.log("Document 'metadata/taxonomy' does not exist!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
