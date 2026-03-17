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

async function checkMaths() {
    try {
        console.log("--- START CHECK ---");
        const docRef = db.doc('metadata/taxonomy');
        const docSnap = await docRef.get();
        const taxonomy = docSnap.data();
        
        if (!taxonomy) {
            console.log("Taxonomy Document Missing!");
            return;
        }

        const bseb10 = taxonomy['bseb_10'] || {};
        const subjects = bseb10.subjects || [];
        console.log("BSEB 10 Subjects: " + subjects.join(', '));

        const paths = [
            'questions/BSEB/Class 10/general/mathematics',
            'questions/BSEB/Class 10/general/maths'
        ];

        for (const p of paths) {
            const snap = await db.collection(p).get();
            console.log("Path: " + p + " -> Count: " + snap.size);
        }

        // Search for the chapter
        const chapter = "द्विघात समीकरण";
        const cg = await db.collectionGroup('mathematics').where('chapter', '==', chapter).get();
        console.log("Chapter found in CG 'mathematics': " + cg.size);
        if (cg.size > 0) {
            console.log("Real Path: " + cg.docs[0].ref.path);
        }

        const cg2 = await db.collectionGroup('maths').where('chapter', '==', chapter).get();
        console.log("Chapter found in CG 'maths': " + cg2.size);
        if (cg2.size > 0) {
            console.log("Real Path: " + cg2.docs[0].ref.path);
        }

    } catch (err) {
        console.log("ERROR OCCURRED:");
        console.log(err.message);
    }
}

checkMaths().then(() => console.log("--- END CHECK ---"));
