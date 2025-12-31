const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc, setDoc } = require('firebase/firestore');

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

const TARGET_CHAPTERS = {
    lifeProcesses: "जैव–प्रक्रम (Life Processes)",
    controlCoordination: "नियंत्रण एवं समन्वय (Control and Coordination)",
    repro: "जीव जनन कैसे करते हैं (How do Organisms Reproduce?)",
    heredity: "आनुवंशिकता एवं जैव–विकास (Heredity and Evolution)",
    energy: "ऊर्जा के स्रोत (Sources of Energy)",
    environment: "हमारा पर्यावरण (Our Environment)",
    resources: "प्राकृतिक संसाधनों का प्रबंधन (Management of Natural Resources)"
};

async function normalize() {
    console.log("Starting Biology Normalization...");

    // Fetch all Biology questions
    // Note: We can't filter by subject='biology' easily without an index if the dataset is huge, 
    // but for 2000 questions it's fine to fetch all or use a composite index if available.
    // Let's fetch all and filter in memory to be safe/easy, or try querying.
    // Given previous scripts used 'questions' collection, let's fetch all (it's around 2k doc reads).

    const querySnapshot = await getDocs(collection(db, "questions"));
    const batchSize = 400;
    let batch = writeBatch(db);
    let count = 0;
    let totalUpdated = 0;

    const updates = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.active !== true) return; // Skip deleted?

        // Check if subject is biology
        // Data might have 'biology' or 'science' with subSubject biology from previous fix
        let isBio = data.subject === 'biology';
        if (!isBio && data.subject === 'science' && data.subSubject?.toLowerCase().includes('biology')) {
            isBio = true;
        }

        if (isBio) {
            let currentChap = (data.chapter || '').toLowerCase();
            let newChap = null;

            // Logic to map keywords
            if (currentChap.match(/life|process|nutrition|respiration|excretion|digest|transport|जैव|पोषण|श्वसन|उत्सर्जन/)) {
                // Check if it's strictly heredity which also has 'जैव' (Jeev/Jaiv diff?)
                // 'जैव–प्रक्रम' vs 'जैव–विकास'
                if (currentChap.includes('विकास') || currentChap.includes('evolution')) {
                    newChap = TARGET_CHAPTERS.heredity;
                } else {
                    newChap = TARGET_CHAPTERS.lifeProcesses;
                }
            }
            else if (currentChap.match(/control|coordination|nervous|hormone|brain|reflex|नियंत्रण|समन्वय/)) {
                newChap = TARGET_CHAPTERS.controlCoordination;
            }
            else if (currentChap.match(/repro|organism|fission|budding|flower|pollination|जनन|reproduce/)) {
                newChap = TARGET_CHAPTERS.repro;
            }
            else if (currentChap.match(/heredity|evolution|genetics|mendel|variation|आनुवंशिकता|विकास/)) {
                newChap = TARGET_CHAPTERS.heredity;
            }
            else if (currentChap.match(/energy|source|fuel|solar|biogas|ऊर्जा|स्रोत/)) {
                newChap = TARGET_CHAPTERS.energy;
            }
            else if (currentChap.match(/environment|ecosystem|ozone|waste|garbage|पर्यावरण/)) {
                // 'Development'?? No.
                newChap = TARGET_CHAPTERS.environment;
            }
            else if (currentChap.match(/resource|management|forest|wildlife|water|dam|coal|petroleum|प्रबंधन|संसाधन/)) {
                newChap = TARGET_CHAPTERS.resources;
            }

            if (newChap && newChap !== data.chapter) {
                updates.push({ ref: doc.ref, chapter: newChap });
            }
        }
    });

    console.log(`Found ${updates.length} questions to normalize.`);

    for (let i = 0; i < updates.length; i++) {
        batch.update(updates[i].ref, { chapter: updates[i].chapter });
        count++;
        totalUpdated++;

        if (count >= batchSize) {
            await batch.commit();
            console.log(`Committed batch of ${count} updates...`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${count} updates...`);
    }

    console.log("Updating Metadata...");
    await updateMetadata();
    console.log("Done!");
    process.exit(0);
}

async function updateMetadata() {
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
        const validSubjects = Array.from(TaxonomyMap[key].subjects).sort();
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

    await setDoc(doc(db, "metadata", "taxonomy"), {
        ...finalTaxonomy,
        lastUpdated: Date.now()
    });
}

normalize();
