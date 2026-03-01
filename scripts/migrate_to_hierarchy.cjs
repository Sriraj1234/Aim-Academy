/**
 * Migration Script: Flat questions/ → Hierarchical questions/{board}/{class}/{stream}/{subject}/
 * 
 * Run: node scripts/migrate_to_hierarchy.cjs
 * 
 * - Reads all docs from flat 'questions' collection
 * - Writes them to subcollection path based on board/class/stream/subject fields
 * - Does NOT delete old flat docs (run delete_flat_questions.cjs after verification)
 */

const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// --- Firebase Init ---
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) { console.error('Missing FIREBASE_PRIVATE_KEY'); process.exit(1); }
    if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        })
    });
}

const db = admin.firestore();

// --- Normalizers (mirrors lib/questionPath.ts logic) ---
function normalizeBoard(board) {
    const b = (board || '').toLowerCase().trim();
    if (b === 'bihar board' || b === 'bseb') return 'BSEB';
    if (b === 'cbse') return 'CBSE';
    if (b === 'icse') return 'ICSE';
    if (b === 'up board' || b === 'up') return 'UP';
    if (b === 'rajasthan board' || b === 'rbse') return 'RBSE';
    return (board || 'Unknown').trim();
}

function normalizeClass(cls) {
    const c = (cls || '').toLowerCase().replace(/[^0-9]/g, '');
    if (!c) return (cls || 'Unknown').trim();
    return `Class ${c}`;
}

function resolveStream(cls, stream) {
    const normalized = normalizeClass(cls);
    const level = parseInt(normalized.replace(/\D/g, '') || '0', 10);
    if (level >= 11) return (stream || 'Science').trim();
    return 'general';
}

function getNewPath(board, cls, stream, subject) {
    const b = normalizeBoard(board);
    const c = normalizeClass(cls);
    const s = resolveStream(cls, stream);
    const sub = (subject || 'Unknown').trim();
    return `questions/${b}/${c}/${s}/${sub}`;
}

async function migrate() {
    console.log('Reading all documents from flat questions collection...');

    const snapshot = await db.collection('questions').get();
    console.log(`Total documents to migrate: ${snapshot.size}`);

    let migrated = 0;
    let errors = 0;
    let skipped = 0;

    // Group into batches of 200 Firestore batch limit
    const BATCH_SIZE = 200;
    let batch = db.batch();
    let batchCount = 0;

    const pathStats = {}; // Track how many go to each path

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const { board, class: cls, stream, subject } = data;

        if (!board || !cls || !subject) {
            console.warn(`Skipping doc ${docSnap.id}: missing board/class/subject`);
            skipped++;
            continue;
        }

        const newPath = getNewPath(board, cls, stream, subject);
        pathStats[newPath] = (pathStats[newPath] || 0) + 1;

        // Write to new subcollection (use same MD5 doc ID)
        const newDocRef = db.doc(`${newPath}/${docSnap.id}`);
        batch.set(newDocRef, data, { merge: true });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            migrated += batchCount;
            process.stdout.write(`\rMigrated: ${migrated}`);
            batch = db.batch();
            batchCount = 0;
        }
    }

    // Commit remaining
    if (batchCount > 0) {
        await batch.commit();
        migrated += batchCount;
    }

    console.log(`\n\n=== Migration Complete ===`);
    console.log(`Migrated:  ${migrated}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Errors:    ${errors}`);
    console.log(`\n=== Collection Paths Created ===`);
    Object.entries(pathStats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([p, count]) => console.log(`  ${count.toString().padStart(4)} docs → ${p}`));

    console.log('\nDone! Old flat collection is UNTOUCHED. Verify and then delete using delete_flat_questions.cjs');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
