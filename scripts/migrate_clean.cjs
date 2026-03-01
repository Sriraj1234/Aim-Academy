/**
 * CLEAN Migration v2: Flat questions → Clean Hierarchical Structure
 * 
 * Naming Convention (ALL LOWERCASE, consistent):
 *   Board:   bseb | cbse | icse | up
 *   Class:   class_10 | class_12 (underscore, no spaces)
 *   Stream:  science | arts | commerce | general  (general for class 10 and below)
 *   Subject: chemistry | hindi | science | english | sanskrit | social_science | ...
 *
 * Firestore Path: questions/{board}/{class}/{stream}/{subject}/{docId}
 * Example: questions/bseb/class_12/science/chemistry/{docId}
 *
 * Run: node scripts/migrate_clean.cjs
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

// ── Normalizers ───────────────────────────────────────────────────────────────
function normalizeBoard(raw) {
    const b = (raw || '').toLowerCase().trim();
    if (b === 'bihar board' || b === 'bseb') return 'bseb';
    if (b === 'cbse') return 'cbse';
    if (b === 'icse') return 'icse';
    if (b === 'up board' || b === 'up') return 'up';
    if (b === 'rbse' || b === 'rajasthan board') return 'rbse';
    return b || 'other';
}

function normalizeClass(raw) {
    const n = (raw || '').toString().replace(/[^0-9]/g, '');
    return n ? `class_${n}` : 'class_other';
}

function normalizeStream(rawClass, rawStream) {
    const n = parseInt((rawClass || '').toString().replace(/[^0-9]/g, '') || '0', 10);
    if (n >= 11) {
        const s = (rawStream || '').toLowerCase().trim();
        if (s === 'science' || !s) return 'science';
        if (s === 'arts' || s === 'art') return 'arts';
        if (s === 'commerce') return 'commerce';
        return s || 'science';
    }
    return 'general';
}

function normalizeSubject(raw) {
    return (raw || 'general')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');   // "social science" → "social_science"
}

function getPath(board, cls, stream, subject) {
    return `questions/${normalizeBoard(board)}/${normalizeClass(cls)}/${normalizeStream(cls, stream)}/${normalizeSubject(subject)}`;
}

// ── Migration ────────────────────────────────────────────────────────────────
async function migrate() {
    console.log('Reading flat questions...');
    const snapshot = await db.collection('questions').get();
    console.log(`Found ${snapshot.size} flat documents.`);

    const pathStats = {};
    let migrated = 0, skipped = 0;
    const BATCH_SIZE = 200;
    let batch = db.batch();
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const { board, class: cls, stream, subject } = data;

        // Skip documents that are BOARD keys (from old messy migration — they have no board field)
        if (!board || !cls || !subject) {
            console.warn(`Skipping ${docSnap.id}: missing board/class/subject`);
            skipped++;
            continue;
        }

        const newPath = getPath(board, cls, stream, subject);
        pathStats[newPath] = (pathStats[newPath] || 0) + 1;

        const newDocRef = db.doc(`${newPath}/${docSnap.id}`);
        batch.set(newDocRef, data, { merge: true });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            migrated += batchCount;
            process.stdout.write(`\rMigrated: ${migrated}/${snapshot.size}`);
            batch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
        migrated += batchCount;
    }

    console.log(`\n\n=== Migration Complete ===`);
    console.log(`Migrated: ${migrated} | Skipped: ${skipped}`);
    console.log(`\n=== Subcollection paths created ===`);
    Object.entries(pathStats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([p, n]) => console.log(`  ${String(n).padStart(5)} → ${p}`));

    console.log('\nNext: Run delete_flat_questions.cjs to clean up.');
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
