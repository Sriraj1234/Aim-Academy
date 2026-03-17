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

const normalizeSubject = (sub) => {
    const s = sub.toLowerCase().trim();
    if (s === 'math' || s === 'maths') return 'mathematics';
    if (s === 'soc science' || s === 'social science') return 'social_science';
    if (s === 'pol science' || s === 'political science') return 'political_science';
    return s.replace(/\s+/g, '_');
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

async function rebuild() {
    console.log("Starting Taxonomy Rebuild Script...");
    const taxonomy = {};
    const boards = ['BSEB', 'CBSE', 'UP', 'ICSE', 'Other'];
    const classes = ['Class 10', 'Class 11', 'Class 12', 'Class 9'];
    const streams = ['general', 'Science', 'Commerce', 'Arts'];
    const commonSubjects = ['science', 'physics', 'chemistry', 'biology', 'mathematics', 'maths', 'hindi', 'english', 'history', 'geography', 'political_science', 'economics', 'disaster_management', 'social_science'];

    for (const board of boards) {
        for (const cls of classes) {
            for (const stream of streams) {
                for (const sub of commonSubjects) {
                    const colPath = `questions/${board}/${cls}/${stream}/${sub}`;
                    const snapshot = await db.collection(colPath).get();
                    if (snapshot.empty) continue;

                    console.log(`Found ${snapshot.size} in ${colPath}`);
                    snapshot.docs.forEach(docSnap => {
                        const data = docSnap.data();
                        const chapter = (data.chapter || 'general').trim();
                        const level = (data.level || 'Easy').trim();
                        let finalSubject = normalizeSubject(sub);

                        if (finalSubject === 'science' && cls === 'Class 10') {
                            const mapped = mapScienceChapter(chapter);
                            if (mapped !== 'science') finalSubject = mapped;
                        }

                        const key = `${board.toLowerCase()}_${cls.replace(/[^0-9]/g, '')}`;
                        if (!taxonomy[key]) taxonomy[key] = { subjects: new Set(), chapters: {} };
                        taxonomy[key].subjects.add(finalSubject);

                        if (!taxonomy[key].chapters[finalSubject]) taxonomy[key].chapters[finalSubject] = [];
                        let existingChap = taxonomy[key].chapters[finalSubject].find(c => c.name === chapter);
                        if (!existingChap) {
                            existingChap = { name: chapter, count: 0, levels: { Easy: 0, Medium: 0, Hard: 0 } };
                            taxonomy[key].chapters[finalSubject].push(existingChap);
                        }
                        existingChap.count++;
                        const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
                        if (['Easy', 'Medium', 'Hard'].includes(normalizedLevel)) existingChap.levels[normalizedLevel]++;
                        else existingChap.levels['Easy']++;
                    });
                }
            }
        }
    }

    const cleanTaxonomy = {};
    Object.keys(taxonomy).forEach(key => {
        // Only include subjects that actually have chapters mapped to them
        const subjectsWithChapters = Array.from(taxonomy[key].subjects).filter(sub => 
            taxonomy[key].chapters[sub] && taxonomy[key].chapters[sub].length > 0
        );

        cleanTaxonomy[key] = {
            subjects: subjectsWithChapters,
            chapters: taxonomy[key].chapters
        };
    });

    await db.doc('metadata/taxonomy').set(cleanTaxonomy);
    console.log("Taxonomy Rebuilt and Saved!");
}

rebuild().catch(console.error);
