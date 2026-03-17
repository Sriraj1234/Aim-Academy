import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, doc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting Taxonomy Rebuild (Client SDK)...");

        // 1. Fetch all questions from ALL subcollections via collectionGroup
        const snapshot = await getDocs(collectionGroup(db, 'questions'));
        console.log(`Fetched ${snapshot.size} questions from all subcollections.`);

        const taxonomy: Record<string, any> = {};

        // 2. Aggregate Data
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            let subject = (data.subject || 'general').toLowerCase().trim();
            const chapter = (data.chapter || 'general').trim();
            const level = (data.level || 'Easy').trim(); // Default to Easy if missing

            // board_class key (e.g., bseb_10)
            const board = (data.board || 'other').toLowerCase();
            const classLevel = (data.class || 'other').toString();
            const key = `${board}_${classLevel}`;

            if (!taxonomy[key]) {
                taxonomy[key] = {
                    subjects: new Set(),
                    chapters: {}
                };
            }

            // Normalization
            if (subject === 'math') subject = 'mathematics';

            // Add normalized subject to set
            taxonomy[key].subjects.add(subject);

            if (!taxonomy[key].chapters[subject]) {
                taxonomy[key].chapters[subject] = [];
            }

            // Check if chapter already exists in list (by name)
            let existingChap = taxonomy[key].chapters[subject].find((c: any) => c.name === chapter);
            if (!existingChap) {
                existingChap = { 
                    name: chapter, 
                    count: 0, 
                    levels: { Easy: 0, Medium: 0, Hard: 0 } 
                };
                taxonomy[key].chapters[subject].push(existingChap);
            }
            
            existingChap.count++;
            
            // Increment level count (case-insensitive key check)
            const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
            if (normalizedLevel === 'Easy' || normalizedLevel === 'Medium' || normalizedLevel === 'Hard') {
                existingChap.levels[normalizedLevel] = (existingChap.levels[normalizedLevel] || 0) + 1;
            } else {
                // Fallback for weird data
                existingChap.levels['Easy'] = (existingChap.levels['Easy'] || 0) + 1;
            }
        });

        // 3. Convert Sets to Arrays for Firestore
        const cleanTaxonomy: any = {};
        Object.keys(taxonomy).forEach(key => {
            cleanTaxonomy[key] = {
                subjects: Array.from(taxonomy[key].subjects),
                chapters: taxonomy[key].chapters
            };
        });

        // 4. Update Metadata Document
        await setDoc(doc(db, 'metadata', 'taxonomy'), cleanTaxonomy);

        return NextResponse.json({
            success: true,
            message: "Taxonomy rebuilt successfully (Client SDK).",
            details: {
                keys: Object.keys(cleanTaxonomy),
                stats: Object.keys(cleanTaxonomy).map(k => ({
                    key: k,
                    subjects: cleanTaxonomy[k].subjects
                }))
            }
        });

    } catch (error: any) {
        console.error("Taxonomy rebuild failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
