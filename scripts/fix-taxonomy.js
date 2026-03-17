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

if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
    privateKey = JSON.parse(`{"key": ${privateKey}}`).key;
} else {
    privateKey = privateKey?.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        })
    });
}

const db = admin.firestore();

const normalizeSubject = (sub) => {
    const s = sub.toLowerCase().trim().replace(/\s+/g, '_');
    if (s === 'mathematics' || s === 'maths' || s === 'math') return 'math';
    
    // Consolidated Social Science Grouping
    const sstKeywords = [
        'social_science', 'soc_science', 'social_studies',
        'pol_science', 'political_science', 'civics',
        'history', 'geography', 'economics', 'disaster_management',
        'itihas', 'bhugol', 'nagrik', 'arthshastra', 'apprit'
    ];
    
    if (sstKeywords.some(kw => s === kw || s.includes(kw))) {
        return 'social_science';
    }
    
    return s;
};

const mapScienceChapter = (chapter) => {
    const c = chapter.toLowerCase();
    const physicsChaps = ['प्रकाश', 'मानव नेत्र', 'विद्युत', 'ऊर्जा', 'prakash', 'manav netra', 'vidyut', 'energy', 'urja'];
    const chemistryChaps = ['तत्वों', 'कार्बन', 'अम्ल', 'धातु', 'रासायनिक', 'acids', 'carbon', 'metals', 'chemical'];
    const biologyChaps = ['जैव', 'नियंत्रण', 'जनन', 'आनुवंशिकता', 'reproduc', 'हमara पर्यावरण', 'पर्यावरण', 'प्रबंधन', 'life processes', 'control', 'reproduce', 'reproduction', 'heredity', 'environment', 'management', 'resources'];

    if (physicsChaps.some(kw => c.includes(kw))) return 'physics';
    if (chemistryChaps.some(kw => c.includes(kw))) return 'chemistry';
    if (biologyChaps.some(kw => c.includes(kw))) return 'biology';
    return 'science';
};

async function fixTaxonomy() {
    console.log("🚀 Starting Dynamic Taxonomy Rebuild...");

    const taxonomy = {};
    const boards = ['BSEB', 'CBSE', 'UP', 'ICSE', 'Other'];
    const classes = ['Class 10', 'Class 11', 'Class 12', 'Class 9'];
    const streams = ['general', 'Science', 'Commerce', 'Arts'];

    for (const board of boards) {
        for (const cls of classes) {
            for (const stream of streams) {
                const basePath = `questions/${board}/${cls}/${stream}`;
                const baseRef = db.doc(basePath);
                
                let subjects = [];
                try {
                    const collections = await baseRef.listCollections();
                    subjects = collections.map(col => col.id);
                } catch (e) {}

                if (subjects.length === 0) continue;

                for (const subId of subjects) {
                    const colPath = `${basePath}/${subId}`;
                    const snapshot = await db.collection(colPath).get();
                    
                    if (snapshot.empty) continue;
                    
                    console.log(`✅ [${board} ${cls}] Found ${snapshot.size} Qs in "${subId}"`);

                    snapshot.docs.forEach(docSnap => {
                        const data = docSnap.data();
                        const chapter = (data.chapter || 'general').trim();
                        const level = (data.level || 'Easy').trim();
                        
                        let finalSubject = normalizeSubject(subId);
                        
                        let sstSection = 'General';
                        let origSubject = subId;
                        
                        if (finalSubject === 'social_science') {
                            sstSection = subId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            
                            if (sstSection.toLowerCase().includes('social science')) sstSection = 'General';
                            if (sstSection.toLowerCase().includes('disaster')) sstSection = 'Disaster Management';
                            if (sstSection.toLowerCase().includes('political') || sstSection.toLowerCase().includes('pol')) sstSection = 'Political Science';
                        }
                        
                        if (finalSubject === 'science' && cls === 'Class 10') {
                            const mapped = mapScienceChapter(chapter);
                            if (mapped !== 'science') finalSubject = mapped;
                        }

                        const key = `${board.toLowerCase()}_${cls.replace(/[^0-9]/g, '')}`;

                        if (!taxonomy[key]) {
                            taxonomy[key] = { subjects: new Set(), chapters: {} };
                        }

                        taxonomy[key].subjects.add(finalSubject);

                        if (!taxonomy[key].chapters[finalSubject]) {
                            taxonomy[key].chapters[finalSubject] = [];
                        }

                        let existingChap = taxonomy[key].chapters[finalSubject].find((c) => c.name === chapter);
                        if (!existingChap) {
                            existingChap = { 
                                name: chapter, 
                                count: 0, 
                                section: sstSection,
                                origSubject: origSubject,
                                levels: { Easy: 0, Medium: 0, Hard: 0 } 
                            };
                            taxonomy[key].chapters[finalSubject].push(existingChap);
                        }
                        
                        existingChap.count++;
                        const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
                        if (['Easy', 'Medium', 'Hard'].includes(normalizedLevel)) {
                            existingChap.levels[normalizedLevel]++;
                        } else {
                            existingChap.levels['Easy']++;
                        }
                    });
                }
            }
        }
    }

    const cleanTaxonomy = {};
    Object.keys(taxonomy).forEach(key => {
        let subjects = Array.from(taxonomy[key].subjects);
        console.log(`📝 Finalizing ${key}: ${subjects.join(', ')}`);
        
        cleanTaxonomy[key] = {
            subjects: subjects.map(s => s === 'math' ? 'mathematics' : s),
            chapters: {}
        };
        
        Object.keys(taxonomy[key].chapters).forEach(subKey => {
            const finalSubKey = subKey === 'math' ? 'mathematics' : subKey;
            cleanTaxonomy[key].chapters[finalSubKey] = taxonomy[key].chapters[subKey];
            
            if (subKey === 'social_science') {
                const uniqueSections = new Set(taxonomy[key].chapters[subKey].map(c => c.section));
                console.log(`   - Social Science sections: ${Array.from(uniqueSections).join(', ')}`);
            }
        });
    });

    await db.collection('metadata').doc('taxonomy').set(cleanTaxonomy);
    console.log("✨ Taxonomy Rebuild Complete!");
}

fixTaxonomy().catch(console.error);
