const admin = require('firebase-admin');
const fs = require('fs');
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

async function debugHierarchy() {
    console.log("Exploring Questions Hierarchy...");
    
    let totalRealCount = 0;
    const pathsFound = [];

    // 1. Get Boards (Root Collection: 'questions')
    const boardsSnap = await db.collection('questions').listDocuments();
    console.log(`Found ${boardsSnap.length} Boards in root 'questions' collection.`);

    for (const boardDoc of boardsSnap) {
        // 2. Get Classes (Subcollections of Board)
        const classesCollections = await boardDoc.listCollections();
        console.log(`Board [${boardDoc.id}] has ${classesCollections.length} Class subcollections.`);

        for (const classCol of classesCollections) {
            // 3. Get Streams (Documents in Class subcollection)
            const streamsSnap = await classCol.listDocuments();
            // console.log(`  Class [${classCol.id}] has ${streamsSnap.length} Stream documents.`);

            for (const streamDoc of streamsSnap) {
                // 4. Get Subjects (Subcollections of Stream)
                const subjectsCollections = await streamDoc.listCollections();
                
                for (const subjectCol of subjectsCollections) {
                    // 5. Count Questions (Documents in Subject subcollection)
                    const questionsSnap = await subjectCol.get();
                    const count = questionsSnap.size;
                    
                    if (count > 0) {
                        const path = `questions/${boardDoc.id}/${classCol.id}/${streamDoc.id}/${subjectCol.id}`;
                        pathsFound.push({ path, count });
                        totalRealCount += count;
                        console.log(`    ✅ Found ${count} questions at: ${path}`);
                    }
                }
            }
        }
    }

    // Also check for "Flat" questions if any remain
    const flatSnap = await db.collection('questions').get();
    if (flatSnap.size > 0) {
        console.log(`⚠️ Found ${flatSnap.size} FLAT questions directly in root 'questions' collection.`);
        totalRealCount += flatSnap.size;
    }

    // Read Metadata for comparison
    const metaSnap = await db.doc('metadata/taxonomy').get();
    const meta = metaSnap.data() || {};
    let metaTotal = 0;
    Object.values(meta).forEach(v => {
        if (v && v.chapters) {
            Object.values(v.chapters).forEach(chaps => {
                if (Array.isArray(chaps)) chaps.forEach(c => metaTotal += (c.count || 0));
            });
        }
    });

    const report = {
        timestamp: new Date().toISOString(),
        actualTotalInDB: totalRealCount,
        totalInMetadata: metaTotal,
        paths: pathsFound,
        flatQuestions: flatSnap.size
    };

    console.log("\nFinal Report:");
    console.log(JSON.stringify(report, null, 2));
    fs.writeFileSync('debug_output.txt', JSON.stringify(report, null, 2));
}

debugHierarchy().catch(console.error);
