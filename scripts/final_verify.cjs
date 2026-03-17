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

async function finalVerify() {
    console.log("--- FINAL VERIFICATION ---");
    
    // 1. Check Metadata
    const metaSnap = await db.doc('metadata/taxonomy').get();
    const taxonomy = metaSnap.data() || {};
    const bseb10 = taxonomy['bseb_10'] || { chapters: {} };
    
    const subjectsToCheck = ['maths', 'mathematics', 'physics', 'chemistry', 'biology', 'science'];
    
    for (const sub of subjectsToCheck) {
        // Metadata report
        const metaChapters = bseb10.chapters[sub] || [];
        const metaCount = metaChapters.reduce((acc, c) => acc + (c.count || 0), 0);
        
        // Actual DB Check (Standardized Path)
        const dbPath = `questions/BSEB/Class 10/general/${sub}`;
        const dbSnap = await db.collection(dbPath).get();
        
        console.log(`Subject: ${sub}`);
        console.log(`  - Metadata Says: ${metaCount} Qs (${metaChapters.length} chapters)`);
        console.log(`  - Actual DB Has: ${dbSnap.size} Qs at ${dbPath}`);
        console.log("-------------------");
    }
}

finalVerify().catch(console.error);
