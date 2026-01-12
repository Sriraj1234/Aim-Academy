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
                    let key = `${board}_${classLevel}`; // e.g. bseb_10
                    if ((classLevel === '11' || classLevel === '12') && stream) {
                        key = `${board}_${classLevel}_${stream}`;
                    }

                    if (fullTaxonomy[key]) {
                        const rawData = fullTaxonomy[key] as TaxonomyData;

                        // Transform to SyllabusBoard format
                        const transformed: SubjectSyllabus[] = rawData.subjects.map(subjectName => {
                            // Basic mapping for colors/icons based on subject name
                            // In a real generic app, these should also be in DB or a robust config

                            const { icon, color } = getSubjectDetails(subjectName);


                            // Get chapters for this subject
                            const rawChapters = rawData.chapters[subjectName] || [];
                            const chapters: Chapter[] = rawChapters.map(ch => ({
                                id: ch.name, // Use name as ID for now or generate slug
                                title: ch.name,
                                hindiTitle: '', // Not available in current taxonomy
                                category: ch.section || 'General'
                            }));

                            return {
                                id: subjectName.toLowerCase().replace(/\s+/g, '-'),
                                name: subjectName,
                                icon,
                                color,
                                chapters
                            };
                        });

                        setData(transformed);
                    } else {
                        setData([]); // No data for this board/class
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
