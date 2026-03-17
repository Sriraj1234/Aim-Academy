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

async function checkAfterRebuild() {
    console.log("--- POST-REBUILD CHECK ---");
    const metaSnap = await db.doc('metadata/taxonomy').get();
    const taxonomy = metaSnap.data() || {};
    
    // Check BSEB 10 specifically
    const bseb10 = taxonomy['bseb_10'];
    if (bseb10) {
        console.log("BSEB 10 Subjects listed in Menu: " + bseb10.subjects.join(', '));
        Object.keys(bseb10.chapters).forEach(sub => {
            const chaps = bseb10.chapters[sub];
            const total = chaps.reduce((acc, c) => acc + (c.count || 0), 0);
            console.log(`  - ${sub}: ${total} Qs across ${chaps.length} chapters.`);
        });
    } else {
        console.log("bseb_10 key missing from Taxonomy!");
    }
    console.log("--- CHECK DONE ---");
}

checkAfterRebuild().catch(console.error);
