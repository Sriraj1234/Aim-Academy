const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, where } = require('firebase/firestore');

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
    // Check one "History" question if possible, or just any 'bseb' '10'
    const qCol = collection(db, 'questions');
    // We try to find one where we might expect History
    const qQuery = query(qCol, where('board', '==', 'bseb'), where('class', '==', '10'), limit(5));

    const snapshot = await getDocs(qQuery);
    snapshot.docs.forEach(doc => {
        console.log("ID:", doc.id);
        console.log("Subject:", doc.data().subject);
        console.log("Chapter:", doc.data().chapter);
        console.log("---");
    });
}
main();
