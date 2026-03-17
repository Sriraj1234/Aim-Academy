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

async function inspectTaxonomy() {
    console.log("--- INSPECTING TAXONOMY DOCUMENT ---");
    const docSnap = await db.doc('metadata/taxonomy').get();
    const taxonomy = docSnap.data();
    
    if (!taxonomy) {
        console.log("Taxonomy Document Missing!");
        return;
    }

    const bseb10 = taxonomy['bseb_10'] || {};
    console.log("BSEB 10 Keys:", Object.keys(bseb10));
    console.log("Subjects Array:", bseb10.subjects);
    
    if (bseb10.chapters) {
        Object.keys(bseb10.chapters).forEach(sub => {
            const chaps = bseb10.chapters[sub];
            console.log(`Subject [${sub}]: ${chaps.length} chapters.`);
            if (chaps.length > 0) {
                console.log(`  - First Chapter: ${chaps[0].name} (${chaps[0].count} Qs)`);
            }
        });
    }

    console.log("\n--- SEARCHING FOR 'SCIENCE' FOLDERS ---");
    const boards = ['BSEB', 'CBSE', 'UP', 'ICSE', 'Other', 'bseb'];
    for (const b of boards) {
      const p = `questions/${b}/Class 10/general/science`;
      const s = await db.collection(p).get();
      if (s.size > 0) console.log(`Path [${p}] has ${s.size} questions.`);
    }

    console.log("--- INSPECTION DONE ---");
}

inspectTaxonomy().catch(console.error);
