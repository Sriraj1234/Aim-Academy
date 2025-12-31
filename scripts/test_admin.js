const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

console.log("Initializing Admin SDK...");

try {
    // Attempt to initialize with default credentials (ADC)
    admin.initializeApp({
        projectId: "aim-83922"
    });
    console.log("Admin SDK initialized.");

    const db = getFirestore();

    async function testWrite() {
        console.log("Attempting Admin write...");
        try {
            const docRef = await db.collection('debug_admin').add({
                test: true,
                timestamp: Date.now()
            });
            console.log("Admin write SUCCESS! ID:", docRef.id);
            process.exit(0);
        } catch (e) {
            console.error("Admin write FAILED:", e.message);
            // Log full error if possible
            // console.error(e);
            process.exit(1);
        }
    }

    testWrite();
} catch (e) {
    console.error("Admin SDK Init Error:", e.message);
    process.exit(1);
}
