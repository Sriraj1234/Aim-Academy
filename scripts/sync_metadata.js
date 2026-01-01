const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc } = require('firebase/firestore');

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

async function updateMetadata() {
    console.log("Fetching ALL questions to rebuild taxonomy...");
    const querySnapshot = await getDocs(collection(db, "questions"));
    console.log(`Found ${querySnapshot.size} total questions.`);

    const TaxonomyMap = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Lowercase normalization
        const sub = data.subject ? data.subject.toLowerCase().trim() : 'other';
        const chap = data.chapter ? data.chapter.trim() : 'General';
        const board = data.board ? data.board.toLowerCase().trim() : 'other'; // Normalize board
        const cls = data.class ? data.class.toString().trim() : 'other';      // Normalize class

        // Create key
        const key = `${board}_${cls}`;

        if (!TaxonomyMap[key]) {
            TaxonomyMap[key] = { subjects: new Set(), chapters: {}, count: 0 };
        }

        // Count per key
        TaxonomyMap[key].count++;

        // Add Subject
        TaxonomyMap[key].subjects.add(sub);

        // Add Chapter
        if (!TaxonomyMap[key].chapters[sub]) {
            TaxonomyMap[key].chapters[sub] = new Map();
        }
        const currentCount = TaxonomyMap[key].chapters[sub].get(chap) || 0;
        TaxonomyMap[key].chapters[sub].set(chap, currentCount + 1);
    });

    console.log("\n--- Generated Taxonomy ---");
    const finalTaxonomy = {};
    Object.keys(TaxonomyMap).forEach(key => {
        console.log(`Key: [${key}] -> ${TaxonomyMap[key].count} questions`);

        const validSubjects = Array.from(TaxonomyMap[key].subjects)
            .filter(s => {
                // Filter junk subjects
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
                            .sort()
                            .map(name => ({ name, count: chapMap.get(name) || 0 }));
                    }
                    return acc;
                }, {})
            };
        }
    });

    console.log("\nSaving to Firestore (metadata/taxonomy)...");
    await setDoc(doc(db, "metadata", "taxonomy"), {
        ...finalTaxonomy,
        lastUpdated: Date.now()
    });
    console.log("Success! Taxomony updated.");
    process.exit(0);
}

updateMetadata();
