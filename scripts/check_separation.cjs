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

async function checkScienceSeparation() {
    console.log("--- CHECKING SCIENCE SEPARATION IN TAXONOMY ---");
    const metaSnap = await db.doc('metadata/taxonomy').get();
    const taxonomy = metaSnap.data() || {};
    
    const bseb10 = taxonomy['bseb_10'];
    if (bseb10) {
        console.log("Subjects Found:", bseb10.subjects.join(', '));
        ['physics', 'chemistry', 'biology', 'science'].forEach(s => {
            if (bseb10.chapters[s]) {
                console.log(`Subject [${s}]: ${bseb10.chapters[s].length} chapters.`);
                // Show first few chapters
                bseb10.chapters[s].slice(0, 3).forEach((c, i) => console.log(`  ${i+1}. ${c.name} (${c.count} Qs)`));
            }
        });
    } else {
        console.log("bseb_10 not found. Rebuild might have failed or the key changed.");
    }
    console.log("--- CHECK DONE ---");
}

checkScienceSeparation().catch(console.error);
