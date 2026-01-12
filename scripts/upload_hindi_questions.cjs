const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// 1. Initialize Firebase
if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log("✅ Admin Initialized");
    } catch (e) {
        console.error("❌ Admin Init Error:", e.message);
        process.exit(1);
    }
}

const db = getFirestore();

const FILES = {
    'Poetry': 'data/Class 12th BSEB Hindi Poetry.xlsx',
    'Prose': 'data/Class 12th BSEB Hindi Prose.xlsx'
};

async function upload() {
    for (const [section, relativePath] of Object.entries(FILES)) {
        const filePath = path.join(__dirname, '..', relativePath);

        if (!require('fs').existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        console.log(`\n==================================================`);
        console.log(`Processing File: ${relativePath} for section: ${section}`);

        try {
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            console.log(`Total Sheets Found in File: ${sheetNames.length}`);

            for (let i = 0; i < sheetNames.length; i++) {
                const sheetName = sheetNames[i];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet);

                console.log(`\n[${i + 1}/${sheetNames.length}] Processing Sheet: "${sheetName}" (${rows.length} rows)`);

                let addedCount = 0;
                let skippedCount = 0;
                let errorCount = 0;

                for (const row of rows) {
                    if (!row.Question || !row.Chapter) {
                        continue;
                    }

                    // Check for duplicates (LOWERCASE 'hindi')
                    try {
                        const qSnapshot = await db.collection('questions')
                            .where('board', '==', 'BSEB')
                            .where('class', '==', '12')
                            .where('subject', '==', 'hindi') // Lowercase
                            .where('section', '==', section)
                            .where('question', '==', row.Question)
                            .limit(1)
                            .get();

                        if (!qSnapshot.empty) {
                            skippedCount++;
                            continue;
                        }

                        // Add new question
                        await db.collection('questions').add({
                            board: 'BSEB',
                            class: '12',
                            subject: 'hindi', // Lowercase
                            chapter: row.Chapter,
                            question: row.Question,
                            options: [
                                row['Option A'] || '',
                                row['Option B'] || '',
                                row['Option C'] || '',
                                row['Option D'] || ''
                            ],
                            correctAnswer: row['Correct Answer'],
                            section: section,
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            uploadedBy: 'admin-script-v3'
                        });
                        addedCount++;
                    } catch (e) {
                        errorCount++;
                    }
                }
                console.log(`   -> Result: Added ${addedCount}, Skipped ${skippedCount}, Errors ${errorCount}`);
            }
        } catch (e) {
            console.error(`CRITICAL ERROR reading file ${relativePath}:`, e.message);
        }
    }
}

upload().then(() => {
    console.log('\nUpload complete.');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
