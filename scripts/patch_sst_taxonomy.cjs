const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
    privateKey = JSON.parse(`{"key": ${privateKey}}`).key;
} else {
    privateKey = privateKey?.replace(/\\n/g, '\n');
}

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

const SUBJECT_KEY_MAP = {
    'political science': 'Political Science',
    'political_science': 'Political Science',
    'disaster management': 'Disaster Management',
    'disaster_management': 'Disaster Management',
};

async function patchTaxonomy() {
    console.log("--- Patching Taxonomy: Adding Political Science & Disaster Management ---");

    // Step 1: Read existing taxonomy
    const taxRef = db.doc('metadata/taxonomy');
    const taxSnap = await taxRef.get();
    const taxonomy = taxSnap.data() || {};

    const key = 'bseb_10';
    if (!taxonomy[key]) {
        console.error("No bseb_10 taxonomy found! Run full rebuild first.");
        return;
    }

    // Step 2: Fetch questions for each missing subject
    const missingSubjects = ['political science', 'disaster management'];
    
    for (const subjectFolder of missingSubjects) {
        const normalizedKey = SUBJECT_KEY_MAP[subjectFolder] || subjectFolder;
        
        // Check if already exists
        if (taxonomy[key].subjects.includes(normalizedKey)) {
            console.log(`✅ "${normalizedKey}" already in taxonomy, skipping.`);
            continue;
        }
        
        const colPath = `questions/BSEB/Class 10/general/${subjectFolder}`;
        console.log(`\n📚 Fetching from: ${colPath}`);
        
        let snapshot;
        try {
            snapshot = await db.collection(colPath).get();
        } catch (e) {
            console.error(`Error fetching ${colPath}:`, e.message);
            continue;
        }
        
        if (snapshot.empty) {
            console.log(`   ⚠️ No questions found at ${colPath}`);
            continue;
        }
        
        console.log(`   ✅ Found ${snapshot.size} questions`);
        
        // Build chapter list
        const chaptersMap = {};
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const chapter = (data.chapter || 'General').trim();
            const level = (data.level || 'Easy').trim();
            
            if (!chaptersMap[chapter]) {
                chaptersMap[chapter] = {
                    name: chapter,
                    count: 0,
                    section: 'General',
                    origSubject: subjectFolder,
                    levels: { Easy: 0, Medium: 0, Hard: 0 }
                };
            }
            
            chaptersMap[chapter].count++;
            const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
            if (['Easy', 'Medium', 'Hard'].includes(normalizedLevel)) {
                chaptersMap[chapter].levels[normalizedLevel]++;
            } else {
                chaptersMap[chapter].levels['Easy']++;
            }
        });
        
        const chapters = Object.values(chaptersMap);
        console.log(`   📖 Chapters found: ${chapters.map(c => `"${c.name}" (${c.count} Qs)`).join(', ')}`);
        
        // Add to taxonomy
        if (!taxonomy[key].subjects.includes(normalizedKey)) {
            taxonomy[key].subjects.push(normalizedKey);
        }
        taxonomy[key].chapters[normalizedKey] = chapters;
    }

    // Step 3: Save updated taxonomy
    console.log("\n💾 Saving patched taxonomy...");
    await taxRef.set(taxonomy);
    
    // Step 4: Verify
    console.log("\n✨ Final bseb_10 subjects:", taxonomy[key].subjects.join(', '));
    console.log("✅ Patch complete!");
}

patchTaxonomy().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
