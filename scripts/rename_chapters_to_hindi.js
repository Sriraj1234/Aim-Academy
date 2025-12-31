const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc, setDoc, query, limit } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCPEYMTsNAShOtfXYZcllBl_Vm6suY8TTY",
    authDomain: "aim-83922.firebaseapp.com",
    projectId: "aim-83922",
    storageBucket: "aim-83922.firebasestorage.app",
    messagingSenderId: "134379665002",
    appId: "1:134379665002:web:34f8abf08f3c3655967c13",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// EXACT STRING MAPPING (From DB Inspection -> To User Hindi)
const RENAME_MAP = {
    "Shram Vibhajan Aur Jati Pratha": "श्रम विभाजन और जाति प्रथा",
    "Vish Ke Dant": "विष के दाँत",
    "Bharat Se Hum Kya Sikhe": "भारत से हम क्या सीखें",
    "Nakhun Kyon Badhte Hain": "नाखून क्यों बढ़ते हैं",
    "Nagari Lipi": "नागरी लिपि",
    "Chapter 6 - Bahadur": "बहादुर",
    "Bahadur": "बहादुर", // Catch variant
    "Parampara Ka Mulyankan": "परंपरा का मूल्यांकन",
    "Chapter 8": "जित-जित मैं निरखत हूँ",
    "Aavinyon": "आविन्यों",
    "Chapter 10": "मछली",
    "Naubatkhane Mein Ibadat": "नौबतखाने में इबादत",
    "Shiksha aur Sanskriti": "शिक्षा और संस्कृति"
};

const HINDI_ORDER = [
    "श्रम विभाजन और जाति प्रथा",
    "विष के दाँत",
    "भारत से हम क्या सीखें",
    "नाखून क्यों बढ़ते हैं",
    "नागरी लिपि",
    "बहादुर",
    "परंपरा का मूल्यांकन",
    "जित-जित मैं निरखत हूँ",
    "आविन्यों",
    "मछली",
    "नौबतखाने में इबादत",
    "शिक्षा और संस्कृति"
];

async function main() {
    console.log("Starting Bulk Rename...");

    // 1. Update Questions
    // We cannot easily query by "not hindi", so we must scan all.
    // Or scan by board/class bseb/10.
    // Let's scan all to be safe for this batch.

    // Iterate in chunks
    let lastDoc = null;
    let processed = 0;
    let updated = 0;

    // Robust batch fetch loop
    const allDocs = await getDocs(collection(db, "questions"));
    const snapshots = allDocs.docs;
    const total = snapshots.length;
    console.log(`Found ${total} questions. Processing...`);

    // Process in batches of 400 for writes
    const batchSize = 400;
    for (let i = 0; i < total; i += batchSize) {
        const chunk = snapshots.slice(i, i + batchSize);
        const batch = writeBatch(db);
        let batchCount = 0;

        chunk.forEach(docSnap => {
            const data = docSnap.data();
            const currentChap = data.chapter;

            // Check if it matches any key in our map (Exact or fuzzy)
            // We use exact check on the keys defined above
            if (RENAME_MAP[currentChap]) {
                batch.update(docSnap.ref, { chapter: RENAME_MAP[currentChap] });
                batchCount++;
            } else {
                // Try fuzzy match if exact fails (e.g. trim issue)
                const trimmed = currentChap.trim();
                if (RENAME_MAP[trimmed]) {
                    batch.update(docSnap.ref, { chapter: RENAME_MAP[trimmed] });
                    batchCount++;
                }
            }
        });

        if (batchCount > 0) {
            await batch.commit();
            updated += batchCount;
        }
        processed += chunk.length;
        console.log(`Processed ${processed}/${total}. Renamed ${updated}.`);
    }

    console.log("Questions renamed. Now updating Metadata...");
    await updateMetadata();
    console.log("Done! Everything should be in Hindi now.");
    process.exit(0);
}

async function updateMetadata() {
    // Re-scan from scratch to ensure clean state
    const querySnapshot = await getDocs(collection(db, "questions"));
    const TaxonomyMap = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const sub = data.subject ? data.subject.toLowerCase() : 'other';
        const chap = data.chapter ? data.chapter : 'General';
        const board = data.board || 'other';
        const cls = data.class || 'other';
        const key = `${board}_${cls}`;

        if (!TaxonomyMap[key]) {
            TaxonomyMap[key] = { subjects: new Set(), chapters: {} };
        }
        TaxonomyMap[key].subjects.add(sub);
        if (!TaxonomyMap[key].chapters[sub]) {
            TaxonomyMap[key].chapters[sub] = new Map();
        }
        const currentCount = TaxonomyMap[key].chapters[sub].get(chap) || 0;
        TaxonomyMap[key].chapters[sub].set(chap, currentCount + 1);
    });

    const finalTaxonomy = {};
    Object.keys(TaxonomyMap).forEach(key => {
        const validSubjects = Array.from(TaxonomyMap[key].subjects)
            .filter(s => {
                const isOption = /^(option|otpion)\s*[a-d0-9]$/i.test(s) || /^[a-d]$/i.test(s) || s.length < 2;
                return !isOption;
            })
            .sort();

        if (validSubjects.length > 0) {
            finalTaxonomy[key] = {
                subjects: validSubjects,
                chapters: validSubjects.reduce((acc, sub) => {
                    if (TaxonomyMap[key].chapters[sub]) {
                        const chapMap = TaxonomyMap[key].chapters[sub];
                        acc[sub] = Array.from(chapMap.keys())
                            // Sort using the HINDI ORDER list
                            .sort((a, b) => {
                                const indexA = HINDI_ORDER.indexOf(a);
                                const indexB = HINDI_ORDER.indexOf(b);
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                return a.localeCompare(b);
                            })
                            .map(name => ({ name, count: chapMap.get(name) || 0 }));
                    }
                    return acc;
                }, {})
            };
        }
    });

    await setDoc(doc(db, "metadata", "taxonomy"), {
        ...finalTaxonomy,
        lastUpdated: Date.now()
    });
}

main();
