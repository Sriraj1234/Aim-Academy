
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function rebuildTaxonomy() {
    console.log("Starting taxonomy reconstruction (Correct Schema)...");

    // Accumulators
    // subjects: Set of unique lowercase subjects
    const subjectsSet = new Set();

    // chapterCounts: Subject -> ChapterName -> Count
    const chapterCounts = {};

    try {
        const querySnapshot = await getDocs(collection(db, 'questions'));
        console.log(`Processing ${querySnapshot.size} questions...`);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Normalize subject to lowercase to match types
            const rawSubject = data.subject || 'uncategorized';
            const subject = rawSubject.toLowerCase().trim();
            const chapter = (data.chapter || 'General').trim();

            // Add to subjects list
            subjectsSet.add(subject);

            // Init chapter map for subject
            if (!chapterCounts[subject]) {
                chapterCounts[subject] = {};
            }

            // Increment chapter count
            chapterCounts[subject][chapter] = (chapterCounts[subject][chapter] || 0) + 1;
        });

        // Format for Metadata
        const formattedSubjects = Array.from(subjectsSet).sort();
        const formattedChapters = {};

        formattedSubjects.forEach(sub => {
            // Convert chapter map to ChapterInfo array
            const chapMap = chapterCounts[sub] || {};
            const chapList = Object.keys(chapMap).map(chapName => ({
                name: chapName,
                count: chapMap[chapName]
            }));

            // Sort chapters alphabetically
            chapList.sort((a, b) => a.name.localeCompare(b.name));

            formattedChapters[sub] = chapList;
        });

        console.log("Reconstructed Data Structure:");
        console.log("Subjects:", formattedSubjects);

        // Update Taxonomy Document
        // Nesting under 'bseb_10' as per app requirement
        const taxonomyRef = doc(db, 'metadata', 'taxonomy');

        const finalData = {
            "bseb_10": {
                subjects: formattedSubjects,
                chapters: formattedChapters
            },
            lastUpdated: new Date()
        };

        await setDoc(taxonomyRef, finalData);

        console.log("Taxonomy metadata successfully rebuilt with CORRECT schema!");
        process.exit(0);

    } catch (error) {
        console.error("Error rebuilding taxonomy:", error);
        process.exit(1);
    }
}

rebuildTaxonomy();
