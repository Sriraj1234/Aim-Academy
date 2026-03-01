/**
 * Audit Script: Check what paths exist in the questions hierarchy
 * Run: node scripts/audit_hierarchy.cjs
 */
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

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

async function audit() {
    console.log('=== Flat questions collection ===');
    const flat = await db.collection('questions').limit(5).get();
    console.log(`Flat docs count (sample): ${flat.size}`);
    if (flat.size > 0) {
        const d = flat.docs[0].data();
        console.log('Sample flat doc board:', d.board, '| class:', d.class, '| subject:', d.subject);
    }

    console.log('\n=== Checking hierarchy: direct children of questions collection ===');
    // List documents directly in questions collection (these would be board IDs if hierarchy exists)
    const allDocs = await db.collection('questions').get();
    console.log(`Total direct docs in questions collection: ${allDocs.size}`);

    // Find docs that look like board keys (not hash IDs)
    const boardDocs = allDocs.docs.filter(d => /^[A-Z]{2,6}$/.test(d.id));
    console.log('Board-key documents found:', boardDocs.map(d => d.id));

    console.log('\n=== Checking specific hierarchical paths ===');
    const paths = [
        'questions/BSEB/Class 12/Science/Chemistry',
        'questions/BSEB/Class 12/general/Chemistry',
        'questions/BSEB/Class 10/general/Science',
        'questions/BSEB/Class 10/general/Hindi',
        'questions/bseb/Class 12/Science/Chemistry',
    ];

    for (const p of paths) {
        const col = await db.collection(p).limit(2).get();
        console.log(`${p}: ${col.size} docs`);
    }

    // Also check total via collectionGroup
    console.log('\n=== CollectionGroup count (all "questions" subcollections) ===');
    const group = await db.collectionGroup('questions').get();
    console.log(`Total docs across ALL questions subcollections: ${group.size}`);

    if (group.size > 0) {
        // Print unique paths
        const uniquePaths = new Set(group.docs.map(d => d.ref.parent.path));
        console.log('Unique collection paths in hierarchy:');
        [...uniquePaths].sort().forEach(p => console.log(' ', p));
    }
}

audit().catch(console.error);
