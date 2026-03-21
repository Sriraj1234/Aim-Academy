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

async function checkSST() {
    console.log("--- Checking BSEB 10 Taxonomy ---");
    const docSnap = await db.doc('metadata/taxonomy').get();
    const taxonomy = docSnap.data();
    
    if (!taxonomy) {
        console.log("NO TAXONOMY FOUND");
        return;
    }

    const bseb10 = taxonomy['bseb_10'] || {};
    console.log("\nSubjects in bseb_10:");
    (bseb10.subjects || []).forEach(s => console.log("  SUBJECT:", JSON.stringify(s)));
    
    console.log("\nChapter keys in bseb_10:");
    Object.keys(bseb10.chapters || {}).forEach(k => {
        const chapters = bseb10.chapters[k];
        const sections = [...new Set(chapters.map(c => c.section))];
        console.log(`  KEY: "${k}" => ${chapters.length} chapters, sections: [${sections.join(', ')}]`);
    });
}

checkSST().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
