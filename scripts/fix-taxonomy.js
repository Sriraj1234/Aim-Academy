import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase Admin credentials in .env.local');
    process.exit(1);
}

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = JSON.parse(`{"key": ${privateKey}}`).key;
} else {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    })
});

const db = admin.firestore();

const sstMergeList = [
    'political_science', 'disaster_management', 'civics', 'geography', 'history', 
    'economics', 'social_science', 'sst', 'social_studies', 'pol_science', 'political science',
    'itihas', 'bhugol', 'nagrik', 'arthshastra'
];

async function fixTaxonomy() {
    console.log("🚀 Starting Advanced Database Taxonomy Fix (with Section Categorization)...");
    try {
        const docRef = db.collection('metadata').doc('taxonomy');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.error("❌ Metadata not found!");
            return;
        }

        const data = docSnap.data();
        let modified = false;

        Object.keys(data).forEach(key => {
            const entry = data[key];
            if (!entry || !entry.chapters) return;

            const combinedChapters = [];
            const foundSSTKeys = [];

            // 1. Gather all SST chapters
            Object.keys(entry.chapters).forEach(subKey => {
                const normKey = subKey.toLowerCase().replace(/\s+/g, '_');
                if (sstMergeList.includes(normKey) || sstMergeList.includes(subKey.toLowerCase())) {
                    const chapters = entry.chapters[subKey] || [];
                    chapters.forEach((chap) => {
                        // PRESERVE ORIGINAL SUBJECT in 'section' field for UI grouping & pathing
                        const exists = combinedChapters.find(c => c.name === chap.name);
                        
                        // Human readable section names
                        let sectionName = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        if (sectionName.toLowerCase() === 'social science') sectionName = 'General';

                        if (!exists) {
                            combinedChapters.push({
                                ...chap,
                                section: sectionName,
                                origSubject: subKey // Add this for precise pathing
                            });
                        } else if (chap.count) {
                            exists.count = (exists.count || 0) + (chap.count || 0);
                            if (!exists.section) exists.section = sectionName;
                            if (!exists.origSubject) exists.origSubject = subKey;
                        }
                    });
                    foundSSTKeys.push(subKey);
                }
            });

            // 2. If we found SST content, merge it into 'social_science'
            if (foundSSTKeys.length > 0) {
                console.log(`[${key}] Merging ${foundSSTKeys.join(', ')} into social_science with sectioning`);
                foundSSTKeys.forEach(k => delete entry.chapters[k]);
                entry.chapters['social_science'] = combinedChapters;

                if (entry.subjects) {
                    const newSubjects = entry.subjects.filter((s) => !foundSSTKeys.includes(s));
                    if (!newSubjects.includes('social_science')) {
                        newSubjects.push('social_science');
                    }
                    entry.subjects = newSubjects;
                }
                modified = true;
            }

            // 3. Ensure Mathematics is in subjects if it has chapters
            if (entry.chapters['mathematics'] && entry.subjects && !entry.subjects.includes('mathematics')) {
                console.log(`[${key}] Restoring Mathematics visibility`);
                entry.subjects.push('mathematics');
                modified = true;
            }
        });

        if (modified) {
            await docRef.set(data);
            console.log("✅ Advanced Database Fix Completed Successfully!");
        } else {
            console.log("✨ Database is already using section categorization. No changes needed.");
        }

    } catch (e) {
        console.error("❌ Error fixing taxonomy:", e);
    }
}

fixTaxonomy();
