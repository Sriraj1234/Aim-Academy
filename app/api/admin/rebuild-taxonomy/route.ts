import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, limit } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Normalizes subject names for consistency
 */
const normalizeSubject = (sub: string): string => {
    const s = sub.toLowerCase().trim();
    if (s === 'math' || s === 'maths') return 'mathematics';
    if (s === 'soc science' || s === 'social science') return 'social_science';
    if (s === 'pol science' || s === 'political science') return 'political_science';
    return s.replace(/\s+/g, '_');
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
        console.log("Starting Taxonomy Rebuild (Advanced Scan)...");

        const taxonomy: Record<string, any> = {};
        
        // Boards and Classes to scan
        const boards = ['BSEB', 'CBSE', 'UP', 'ICSE', 'Other'];
        const classes = ['Class 10', 'Class 11', 'Class 12', 'Class 9'];
        const streams = ['general', 'Science', 'Commerce', 'Arts'];
        
        // Known subject collections to scan (since we can't listCollections on Client SDK)
        const commonSubjects = [
            'science', 'physics', 'chemistry', 'biology', 
            'mathematics', 'maths', 'hindi', 'english', 
            'history', 'geography', 'political_science', 'economics', 
            'disaster_management', 'social_science'
        ];

        for (const board of boards) {
            for (const cls of classes) {
                for (const stream of streams) {
                    for (const sub of commonSubjects) {
                        const colPath = `questions/${board}/${cls}/${stream}/${sub}`;
                        const snapshot = await getDocs(collection(db, colPath));
                        
                        if (snapshot.empty) continue;
                        
                        console.log(`Scanning ${colPath}: found ${snapshot.size} questions.`);

                        snapshot.docs.forEach(docSnap => {
                            const data = docSnap.data();
                            const chapter = (data.chapter || 'general').trim();
                            const level = (data.level || 'Easy').trim();
                            
                            // Determine final subject (Auto-separation for Science)
                            let finalSubject = normalizeSubject(sub);
                            
                            // ── SCIENCE DEDUPLICATION ──
                            // If the source collection is 'science', we ONLY want it to appear under mapped subjects (Phys/Chem/Bio)
                            // and NOT under a general 'science' subject in the taxonomy to avoid duplicate cards.
                            if (finalSubject === 'science' && cls === 'Class 10') {
                                const mapped = mapScienceChapter(chapter);
                                if (mapped !== 'science') {
                                    finalSubject = mapped;
                                } else {
                                    // If no mapping found, we keep it as 'science' but this usually shouldn't happen for Class 10
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
                    }
                }
            }
        }

        // Convert Sets to Arrays
        const cleanTaxonomy: any = {};
        Object.keys(taxonomy).forEach(key => {
            cleanTaxonomy[key] = {
                subjects: Array.from(taxonomy[key].subjects),
                chapters: taxonomy[key].chapters
            };
        });

        await setDoc(doc(db, 'metadata', 'taxonomy'), cleanTaxonomy);

        return NextResponse.json({
            success: true,
            message: "Taxonomy rebuilt successfully with autoseparation.",
            subjectsFound: Object.keys(cleanTaxonomy).reduce((acc: any, k) => {
                acc[k] = cleanTaxonomy[k].subjects;
                return acc;
            }, {})
        });

    } catch (error: any) {
        console.error("Taxonomy rebuild failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
