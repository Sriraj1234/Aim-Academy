/**
 * Fix Chemistry correctAnswer: text string → numeric index
 *
 * Chemistry questions uploaded from Excel have correctAnswer as the actual
 * answer text (e.g. "दीर्घ परासी (Long Range)") instead of the option index
 * (e.g. 0). This script finds the matching option and updates to the index.
 *
 * Run: node scripts/fix_chem_correct_answer.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

if (!admin.apps.length) {
    let pk = process.env.FIREBASE_PRIVATE_KEY;
    if (!pk) { console.error('Missing FIREBASE_PRIVATE_KEY'); process.exit(1); }
    if (pk.includes('\\n')) pk = pk.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }) });
}

const db = admin.firestore();

async function fix() {
    // All chemistry docs live in the NEW hierarchy path
    const chemPath = 'questions/bseb/class_12/science/chemistry';
    console.log(`Reading all docs from: ${chemPath}`);
    const snap = await db.collection(chemPath).get();
    console.log(`Found ${snap.size} Chemistry questions.`);

    let fixed = 0, skipped = 0, notFound = 0;
    const BATCH_SIZE = 200;
    let batch = db.batch();
    let batchCount = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const { correctAnswer, options } = data;

        // Only fix if correctAnswer is a STRING (not already a number)
        if (typeof correctAnswer === 'number') {
            skipped++;
            continue;
        }

        if (!Array.isArray(options)) {
            console.warn(`Skipping ${docSnap.id}: no options array`);
            notFound++;
            continue;
        }

        // Find which option index matches the correctAnswer text
        const ansText = String(correctAnswer).trim();
        let idx = options.findIndex(opt => String(opt).trim() === ansText);

        // Fallback: try case-insensitive match
        if (idx === -1) {
            idx = options.findIndex(opt => String(opt).trim().toLowerCase() === ansText.toLowerCase());
        }

        if (idx === -1) {
            // Try matching letter prefix like "Option A", "A", etc.
            const letter = ansText.toUpperCase().trim();
            if (letter === 'A' || letter === 'OPTION A') idx = 0;
            else if (letter === 'B' || letter === 'OPTION B') idx = 1;
            else if (letter === 'C' || letter === 'OPTION C') idx = 2;
            else if (letter === 'D' || letter === 'OPTION D') idx = 3;
        }

        if (idx === -1) {
            console.warn(`Could not find match for "${ansText.substring(0, 40)}" in options of ${docSnap.id}`);
            notFound++;
            continue;
        }

        batch.update(docSnap.ref, { correctAnswer: idx });
        batchCount++;
        fixed++;

        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            process.stdout.write(`\rFixed: ${fixed}/${snap.size}`);
            batch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`\n\n=== Done ===`);
    console.log(`Fixed:      ${fixed} questions (text → index)`);
    console.log(`Already OK: ${skipped} questions (already number)`);
    console.log(`Not found:  ${notFound} questions (no matching option)`);
}

fix().catch(err => { console.error('Error:', err); process.exit(1); });
