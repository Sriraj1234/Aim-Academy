import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Normalizes subject names for consistency
 */
const normalizeSubject = (sub: string): string => {
    const s = sub.toLowerCase().trim().replace(/\s+/g, '_');
    if (s === 'mathematics' || s === 'maths' || s === 'math') return 'math';
    
    // Consolidated Social Science Grouping
    const sstKeywords = [
        'social_science', 'soc_science', 'social_studies',
        'pol_science', 'political_science', 'civics',
        'history', 'geography', 'economics', 'disaster_management',
        'itihas', 'bhugol', 'nagrik', 'arthshastra', 'apprit'
    ];
    
    if (sstKeywords.includes(s)) {
        return 'social_science';
    }
    
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
        console.log("Starting Taxonomy Rebuild (Admin SDK - Subcollection Scan)...");

        // Use Firebase Admin SDK to bypass Firestore rules
        const db = getAdminDb();
        
        const taxonomy: Record<string, any> = {};
        
        // Boards, Classes, Streams, and Subjects to scan
        const boards = ['BSEB', 'CBSE', 'UP', 'ICSE', 'Other'];
        const classes = ['Class 10', 'Class 11', 'Class 12', 'Class 9'];
        const streams = ['general', 'Science', 'Commerce', 'Arts'];
        
        // Known subject collections to scan
        const commonSubjects = [
            'science', 'physics', 'chemistry', 'biology', 
            'math', 'mathematics', 'maths', 'hindi', 'english', 'sanskrit',
            'history', 'geography', 'political_science', 'economics', 
            'disaster_management', 'social_science', 'civics', 'social_studies'
        ];

        let totalScanned = 0;
        let pathsScanned = 0;

        for (const board of boards) {
            for (const cls of classes) {
                for (const stream of streams) {
                    for (const sub of commonSubjects) {
                        const colPath = `questions/${board}/${cls}/${stream}/${sub}`;
                        pathsScanned++;
                        
                        try {
                            const snapshot = await db.collection(colPath).get();
                            
                            if (snapshot.empty) continue;
                            
                            console.log(`Scanning ${colPath}: found ${snapshot.size} questions.`);
                            totalScanned += snapshot.size;

                            snapshot.docs.forEach(docSnap => {
                                const data = docSnap.data();
                                const chapter = (data.chapter || 'general').trim();
                                const level = (data.level || 'Easy').trim();
                                
                                // Determine final subject
                                let finalSubject = normalizeSubject(sub);
                                
                                // SST Sectioning Info
                                let sstSection = 'General';
                                let origSubject = sub;
                                if (finalSubject === 'social_science') {
                                    sstSection = sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    if (sstSection.toLowerCase() === 'social science') sstSection = 'General';
                                }
                                
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
                                        section: sstSection,
                                        origSubject: origSubject,
                                        levels: { Easy: 0, Medium: 0, Hard: 0 } 
                                    };
                                    taxonomy[key].chapters[finalSubject].push(existingChap);
                                }
                                
                                existingChap.count++;
                                
                                const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
                                if (normalizedLevel === 'Easy' || normalizedLevel === 'Medium' || normalizedLevel === 'Hard') {
                                    existingChap.levels[normalizedLevel]++;
                                } else {
                                    existingChap.levels['Easy']++;
                                }
                            });
                        } catch (err: any) {
                            // Skip inaccessible paths silently
                        }
                    }
                }
            }
        }

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
            message: `Taxonomy rebuilt successfully. Scanned ${totalScanned} questions across ${pathsScanned} paths.`,
            summary
        });

    } catch (error: any) {
        console.error("Taxonomy rebuild failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
