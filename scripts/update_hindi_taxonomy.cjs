const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (!rawKey) process.exit(1);

const processedKey = rawKey.replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: processedKey,
        })
    });
}

const db = admin.firestore();

async function updateTaxonomy() {
    console.log("Starting Taxonomy Update...");
    const docRef = db.collection('metadata').doc('taxonomy');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.error("Taxonomy document not found!");
        return;
    }

    const data = docSnap.data();
    const bseb10 = data['bseb_10'];

    if (!bseb10 || !bseb10.chapters) {
        console.error("BSEB 10 chapters not found");
        return;
    }

    // Handle case sensitivity
    const hindiKey = bseb10.chapters['Hindi'] ? 'Hindi' : (bseb10.chapters['hindi'] ? 'hindi' : null);

    if (!hindiKey) {
        console.error("Hindi chapters not found");
        return;
    }

    let chapters = bseb10.chapters[hindiKey];
    let updatedCount = 0;

    const updatedChapters = chapters.map(ch => {
        // Logic: Keep Poetry as Poetry, everything else becomes Prose
        // Also perform simple cleanup if needed
        let newSection = ch.section;

        if (ch.section === 'Poetry') {
            newSection = 'Poetry';
        } else {
            newSection = 'Prose';
            updatedCount++;
        }

        return {
            ...ch,
            section: newSection
        };
    });

    // Update the local data object
    bseb10.chapters[hindiKey] = updatedChapters;

    // Write back to Firestore
    await docRef.update({
        'bseb_10': bseb10
    });

    console.log(`Successfully updated ${updatedCount} chapters to 'Prose'.`);
    console.log(`Total Hindi chapters: ${updatedChapters.length}`);
}

updateTaxonomy().catch(console.error);
