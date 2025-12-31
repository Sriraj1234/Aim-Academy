const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "134379665002",
    appId: "1:134379665002:web:34f8abf08f3c3655967c13",
};

console.log("Initializing Firebase...");
try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("Firebase initialized.");

    async function testWrite() {
        console.log("Attempting to write 1 document...");
        try {
            const docRef = await addDoc(collection(db, "debug_test"), {
                test: true,
                timestamp: Date.now()
            });
            console.log("Document written with ID: ", docRef.id);
            process.exit(0);
        } catch (e) {
            console.error("Error adding document: ", e);
            process.exit(1);
        }
    }

    testWrite();
} catch (e) {
    console.error("Initialization error:", e);
}
