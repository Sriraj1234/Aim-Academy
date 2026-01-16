import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SubjectSyllabus, Chapter } from '@/data/syllabusData'; // Recycle types for now

export interface TaxonomyData {
    subjects: string[];
    chapters: Record<string, { name: string; count: number; section?: string }[]>;
}

// Helper to get efficient icons and colors
const getSubjectDetails = (subjectName: string) => {
    const lower = subjectName.toLowerCase();

    if (lower.includes('math')) return { icon: '📐', color: 'from-blue-600 to-indigo-600' };
    if (lower.includes('physics')) return { icon: '🌌', color: 'from-violet-600 to-purple-600' };
    if (lower.includes('chemistry')) return { icon: '🧪', color: 'from-emerald-600 to-teal-600' };
    if (lower.includes('biology')) return { icon: '🦠', color: 'from-green-500 to-emerald-500' };
    if (lower.includes('science')) return { icon: '🧬', color: 'from-cyan-500 to-blue-500' };

    if (lower.includes('history')) return { icon: '🏰', color: 'from-amber-700 to-orange-800' };
    if (lower.includes('geography')) return { icon: '🌋', color: 'from-blue-500 to-cyan-600' };
    if (lower.includes('polity') || lower.includes('civics') || lower.includes('political')) return { icon: '⚖️', color: 'from-red-700 to-rose-800' };
    if (lower.includes('economics')) return { icon: '💰', color: 'from-green-700 to-emerald-800' };
    if (lower.includes('social') || lower.includes('sst')) return { icon: '🌍', color: 'from-orange-500 to-amber-500' };
    if (lower.includes('disaster')) return { icon: '🚨', color: 'from-red-500 to-orange-500' };

    if (lower.includes('hindi')) return { icon: 'अ', color: 'from-pink-600 to-rose-500' };
    if (lower.includes('english')) return { icon: '🅰️', color: 'from-indigo-600 to-blue-600' };
    if (lower.includes('sanskrit')) return { icon: '🕉️', color: 'from-orange-400 to-amber-400' };
    if (lower.includes('urdu')) return { icon: '🕌', color: 'from-emerald-600 to-green-700' };
    if (lower.includes('maithili')) return { icon: '🥘', color: 'from-yellow-600 to-orange-600' };
    if (lower.includes('bhojpuri')) return { icon: '🎤', color: 'from-pink-500 to-rose-500' };

    if (lower.includes('home science')) return { icon: '🏠', color: 'from-pink-400 to-rose-400' };
    if (lower.includes('agriculture')) return { icon: '🌾', color: 'from-green-600 to-lime-600' };
    if (lower.includes('music')) return { icon: '🎵', color: 'from-violet-500 to-fuchsia-500' };
    if (lower.includes('yoga')) return { icon: '🧘', color: 'from-teal-500 to-green-500' };

    return { icon: '📚', color: 'from-slate-500 to-gray-600' };
};

export const useTaxonomy = (board: string | undefined, classLevel: string | undefined, stream?: string) => {
    const [data, setData] = useState<SubjectSyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTaxonomy = async () => {
            if (!board || !classLevel) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const docRef = doc(db, 'metadata', 'taxonomy');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const fullTaxonomy = docSnap.data();

                    // Key 1: Generic (e.g. bseb_12 or bseb_12_common)
                    const baseKey = `${board}_${classLevel}`;

                    // Key 2: Stream Specific (e.g. bseb_12_science)
                    let streamKey = '';
                    if ((classLevel === '11' || classLevel === '12') && stream) {
                        streamKey = `${board}_${classLevel}_${stream}`;
                    }

                    // Collect data from both keys
                    const subjectsMap = new Map<string, { name: string, chapters: any[] }>();

                    const processKey = (k: string) => {
                        if (fullTaxonomy[k]) {
                            const rawData = fullTaxonomy[k] as TaxonomyData;
                            rawData.subjects.forEach(subjectName => {
                                // Normalize subject name to lowercase for deduping
                                const norm = subjectName.toLowerCase();
                                if (!subjectsMap.has(norm)) {
                                    subjectsMap.set(norm, {
                                        name: subjectName, // Keep original casing
                                        chapters: rawData.chapters[subjectName] || []
                                    });
                                } else {
                                    // Optional: Merge chapters if subject exists in both?
                                    // For now, first come first serve (Stream specific should ideally override or merge)
                                    // Let's merge chapters carefully
                                    const existing = subjectsMap.get(norm)!;
                                    const newChapters = rawData.chapters[subjectName] || [];
                                    // Simple concat for chapters
                                    existing.chapters = [...existing.chapters, ...newChapters];
                                }
                            });
                        }
                    }

                    // Process Generic first, then Stream (so stream specific subjects are added)
                    // actually, order doesn't strictly matter for set if unique, but let's process both
                    processKey(baseKey);
                    if (streamKey) processKey(streamKey);

                    if (subjectsMap.size > 0) {
                        // Transform to SyllabusBoard format
                        const transformed: SubjectSyllabus[] = Array.from(subjectsMap.values()).map(item => {
                            const subjectName = item.name;
                            const { icon, color } = getSubjectDetails(subjectName);

                            const chapters: Chapter[] = item.chapters.map((ch: any) => ({
                                id: ch.name,
                                title: ch.name,
                                hindiTitle: '',
                                category: ch.section || 'General'
                            }));

                            // Remove Duplicate Chapters by Title
                            const uniqueChapters = chapters.filter((c, index, self) =>
                                index === self.findIndex((t) => t.title === c.title)
                            );

                            return {
                                id: subjectName.toLowerCase().replace(/\s+/g, '-'),
                                name: subjectName,
                                icon,
                                color,
                                chapters: uniqueChapters
                            };
                        });

                        setData(transformed);
                    } else {
                        setData([]);
                    }
                }
            } catch (err: any) {
                console.error("Error fetching taxonomy:", err);
                setError(err.message || 'Failed to fetch syllabus');
            } finally {
                setLoading(false);
            }
        };

        fetchTaxonomy();
    }, [board, classLevel, stream]);

    return { data, loading, error };
};
