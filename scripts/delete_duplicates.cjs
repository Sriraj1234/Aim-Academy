const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

async function deleteCollection(collectionRef) {
    const query = collectionRef.limit(100);
    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function cleanupDuplicates() {
    const targetBoards = ['bseb', 'cbse', 'up', 'icse']; // Lowercase versions
    let totalDeleted = 0;

    console.log("Starting cleanup of LOWERCASE board paths...");

    for (const board of targetBoards) {
        const boardDoc = db.collection('questions').doc(board);
        const classesCollections = await boardDoc.listCollections();
        
        for (const classCol of classesCollections) {
            const streamsSnap = await classCol.listDocuments();
            for (const streamDoc of streamsSnap) {
                const subjectsCollections = await streamDoc.listCollections();
                for (const subjectCol of subjectsCollections) {
                    const snap = await subjectCol.get();
                    if (snap.size > 0) {
                        console.log(`Deleting ${snap.size} items from ${subjectCol.path}`);
                        await deleteCollection(subjectCol);
                        totalDeleted += snap.size;
                    }
                }
            }
        }
    }

    console.log(`\nCleanup Complete! Total Deleted: ${totalDeleted} questions.`);
}

cleanupDuplicates().catch(console.error);
