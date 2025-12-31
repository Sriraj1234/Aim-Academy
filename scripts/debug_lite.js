const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore/lite');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "134379665002",
    appId: "1:134379665002:web:34f8abf08f3c3655967c13",
};

console.log("Initializing Firebase Lite...");
try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("Firebase Lite initialized.");

    async function testWrite() {
        console.log("Attempting Lite write...");
        // Note: Lite doesn't support offline caching or complex listeners, should be safer.
        try {
            // Note: Lite writes still require permission. If rules are strict, this should return proper error, not crash.
            const docRef = await addDoc(collection(db, "debug_lite"), {
                test: true,
                timestamp: Date.now()
            });
            console.log("Lite write SUCCESS! ID:", docRef.id);
            process.exit(0);
        } catch (e) {
            console.error("Lite write FAILED (Expected if rules strict):", e.message);
            // Check if it's permission denied (good) or crash (bad)
            if (e.code === 'permission-denied') {
                console.log("Confirmed: Permission Denied. Connection works!");
                // If this works, I can use Lite + Deployed Rules.
            }
            process.exit(1);
        }
    }

    testWrite();
} catch (e) {
    console.error("Lite Init Error:", e);
    process.exit(1);
}
