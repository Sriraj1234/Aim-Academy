import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Normalizes subject names for consistency
 */
const normalizeSubject = (sub: string): string => {
    const s = sub.toLowerCase().trim().replace(/\s+/g, '_');
    
    // Normalize math variants
    if (s === 'mathematics' || s === 'maths' || s === 'math') return 'mathematics';
    
    // Normalize disaster management spelling variations (space OR underscore in Firebase)
    if (s === 'disaster_management' || s === 'digaster_management' || s === 'disastermanagement') return 'Disaster Management';
    
    // Normalize political science variants (space OR underscore in Firebase)
    if (s === 'political_science' || s === 'pol_science' || s === 'civics') return 'Political Science';
    
    // Normalize social studies to social_science (the general catch-all only)
    if (s === 'social_studies' || s === 'soc_science' || s === 'social_science') return 'social_science';
    
    // Keep all individual SST subjects (history, geography, economics, Political Science, Disaster Management)
    // as their OWN separate keys. The UI groups them visually, but taxonomy should store individually.
    
    return s;
};

/**
 * Maps chapters from the 'science' collection to specific sub-subjects
 */
const mapScienceChapter = (chapter: string): string => {
    const c = chapter.toLowerCase();
    
    const physicsChaps = ['प्रकाश', 'मानव नेत्र', 'विद्युत', 'ऊर्जा', 'prakash', 'manav netra', 'vidyut', 'energy', 'urja'];
    const chemistryChaps = ['तत्वों', 'कार्बन', 'अम्ल', 'धातु', 'रासायनिक', 'acids', 'carbon', 'metals', 'chemical'];
    const biologyChaps = ['जैव', 'नियंत्रण', 'जनन', 'आनुवंशिकता', 'reproduc', 'हमara पर्यावरण', 'पर्यावरण', 'प्रबंधन', 'life processes', 'control', 'reproduce', 'reproduction', 'heredity', 'environment', 'management', 'resources'];

    if (physicsChaps.some(kw => c.includes(kw))) return 'physics';
    if (chemistryChaps.some(kw => c.includes(kw))) return 'chemistry';
    if (biologyChaps.some(kw => c.includes(kw))) return 'biology';
    
    return 'science'; // Fallback
};

export async function GET() {
    try {
        console.log("Starting Taxonomy Rebuild (Admin SDK - Optimized collectionGroup Scan)...");

        // Use Firebase Admin SDK to bypass Firestore rules
        const db = getAdminDb();
        
        const taxonomy: Record<string, any> = {};
        
        // ── Firestore Phantom Document Workaround ─────────────────
        // In Firestore, if you upload directly to `questions/BSEB/Class 10/general/maths`,
        // the documents `BSEB`, `Class 10`, and `general` do NOT officially exist, so traversing
        // them via `.listCollections()` fails. Instead, we use `collectionGroup` with an exhaustive list of known subject names.
        
        const subjectsToScan = [
            'physics', 'chemistry', 'biology', 'science',
            'mathematics', 'maths', 'math',
            'history', 'geography', 
            // Political Science: stored with SPACES in Firebase (exact collection name matters for collectionGroup)
            'political science', 'political_science', 'pol_science', 'civics',
            'economics', 'social_science', 'soc_science', 'social_studies', 
            // Disaster Management: stored with SPACES in Firebase
            'disaster management', 'disaster_management', 'digaster_management', 'disastermanagement',
            'hindi', 'english', 'sanskrit', 'urdu',
            'accountancy', 'business_studies', 'commerce',
            'computer_science', 'information_technology', 'general_knowledge',
            // Hindi transliterations just in case
            'itihas', 'bhugol', 'nagrik', 'arthshastra', 'apprit'
        ];

        console.log(`Scanning across ${subjectsToScan.length} known subject variations globally...`);

        let totalScanned = 0;
        let subjectsFound = 0;

        // Perform parallel collectionGroup queries (significantly faster than nested loops)
        const scanPromises = subjectsToScan.map(async (subjectName) => {
            try {
                // This queries for the collection name globally, much faster than manually iterating paths
                const snapshot = await db.collectionGroup(subjectName).get();
                if (snapshot.empty) return;

                console.log(`Found collectionGroup '${subjectName}': ${snapshot.size} docs.`);
                
                snapshot.docs.forEach(docSnap => {
                    const path = docSnap.ref.path;
                    const segments = path.split('/');
                    
                    // Path format: questions/{board}/{class}/{stream}/{subject}/{docId}
                    // segments[0] should be 'questions'
                    if (segments[0] !== 'questions' || segments.length < 6) return;

                    const board = segments[1];
                    const cls = segments[2];
                    const stream = segments[3];
                    const subject = segments[4]; // Should be subjectName or similar
                    
                    const data = docSnap.data();
                    const chapter = (data.chapter || 'general').trim();
                    const level = (data.level || 'Easy').trim();
                    
                    // Determine final subject
                    let finalSubject = normalizeSubject(subject);
                    
                    // origSubject: the actual collection name stored in Firestore (used for quiz fetching)
                    const origSubject = subject.toLowerCase().replace(/\s+/g, '_');
                    
                    // Section for grouping chapters within a subject (e.g., Poetry vs Prose in English)
                    // For SST subjects we just use 'General' since each is its own subject card now
                    const sectionLabel = 'General';
                    
                    // Science deduplication for Class 10
                    if (finalSubject === 'science' && cls === 'Class 10') {
                        const mapped = mapScienceChapter(chapter);
                        if (mapped !== 'science') {
                            finalSubject = mapped;
                        }
                    }

                    const key = `${board.toLowerCase()}_${cls.replace(/[^0-9]/g, '')}`;

                    if (!taxonomy[key]) {
                        taxonomy[key] = { subjects: new Set(), chapters: {} };
                    }

                    taxonomy[key].subjects.add(finalSubject);

                    if (!taxonomy[key].chapters[finalSubject]) {
                        taxonomy[key].chapters[finalSubject] = [];
                    }

                    let existingChap = taxonomy[key].chapters[finalSubject].find((c: any) => c.name === chapter);
                    if (!existingChap) {
                        existingChap = { 
                            name: chapter, 
                            count: 0, 
                            section: sectionLabel,
                            origSubject: origSubject,
                            levels: { Easy: 0, Medium: 0, Hard: 0 } 
                        };
                        taxonomy[key].chapters[finalSubject].push(existingChap);
                    }
                    
                    existingChap.count++;
                    totalScanned++;
                    
                    const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
                    if (normalizedLevel === 'Easy' || normalizedLevel === 'Medium' || normalizedLevel === 'Hard') {
                        existingChap.levels[normalizedLevel]++;
                    } else {
                        existingChap.levels['Easy']++;
                    }
                });
                subjectsFound++;
            } catch (err: any) {
                console.error(`Error scanning subject ${subjectName}:`, err.message);
            }
        });

        await Promise.all(scanPromises);

        // Convert Sets to Arrays and Cleanup
        const cleanTaxonomy: any = {};
        Object.keys(taxonomy).forEach(key => {
            let subjects = Array.from(taxonomy[key].subjects) as string[];
            
            cleanTaxonomy[key] = {
                subjects: subjects.map(s => s === 'math' ? 'mathematics' : s),
                chapters: {}
            };
            
            // Rename math chapters key too
            Object.keys(taxonomy[key].chapters).forEach(subKey => {
                const finalSubKey = subKey === 'math' ? 'mathematics' : subKey;
                cleanTaxonomy[key].chapters[finalSubKey] = taxonomy[key].chapters[subKey];
                
                // Ensure all math chapters have origSubject = 'math'
                if (finalSubKey === 'mathematics') {
                    cleanTaxonomy[key].chapters[finalSubKey].forEach((c: any) => {
                        c.origSubject = 'math';
                    });
                }
            });
        });

        // Write using Admin SDK (bypasses Firestore rules)
        await db.doc('metadata/taxonomy').set(cleanTaxonomy);

        const summary: Record<string, any> = {};
        Object.keys(cleanTaxonomy).forEach(k => {
            summary[k] = {
                subjects: cleanTaxonomy[k].subjects,
                chapterCounts: Object.keys(cleanTaxonomy[k].chapters).reduce((acc: any, sub) => {
                    acc[sub] = cleanTaxonomy[k].chapters[sub].length;
                    return acc;
                }, {})
            };
        });

        return NextResponse.json({
            success: true,
            message: `Taxonomy rebuilt successfully in record time! Scanned ${totalScanned} questions across ${subjectsFound} subjects.`,
            summary
        });

    } catch (error: any) {
        console.error("Taxonomy rebuild failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
