const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

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

// Mapped to User's Hindi Preference (1-12)
const ENGLISH_CHAPTER_MAPPING = [
    "Shram Vibhajan",      // 1. श्रम विभाजन...
    "Vish Ke Dant",        // 2. विष के दाँत
    "Bharat Se Hum",       // 3. भारत से हम क्या सीखें
    "Nakhun Kyon",         // 4. नाखून क्यों बढ़ते हैं
    "Nagari Lipi",         // 5. नागरी लिपि
    "Bahadur",             // 6. बहादुर (Matches "Chapter 6 - Bahadur")
    "Parampara Ka",        // 7. परंपरा का मूल्यांकन
    "Chapter 8",           // 8. जित-जित... (Appears as "Chapter 8" in DB)
    "Aavinyon",            // 9. आविन्यों
    "Chapter 10",          // 10. मछली (Appears as "Chapter 10" in DB)
    "Naubatkhane",         // 11. नौबतखाने में इबादत
    "Shiksha aur"          // 12. शिक्षा और संस्कृति
];

async function main() {
    console.log("Reading metadata...");
    const ref = doc(db, 'metadata', 'taxonomy');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        console.error("No metadata found!");
        return;
    }

    const data = snap.data();
    const newData = { ...data };

    Object.keys(newData).forEach(key => {
        const boardData = newData[key];
        if (boardData.chapters) {
            Object.keys(boardData.chapters).forEach(subject => {
                const chapters = boardData.chapters[subject]; // Array of objects { name, count }
                if (Array.isArray(chapters)) {
                    // CUSTOM SORT based on English Mapping
                    chapters.sort((a, b) => {
                        const nameA = a.name.toLowerCase();
                        const nameB = b.name.toLowerCase();

                        const indexA = ENGLISH_CHAPTER_MAPPING.findIndex(key => nameA.includes(key.toLowerCase()));
                        const indexB = ENGLISH_CHAPTER_MAPPING.findIndex(key => nameB.includes(key.toLowerCase()));

                        // Sort by mapped index
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;

                        // Fallback
                        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                    });
                }
            });
        }
    });

    console.log("Saving sorted metadata...");
    await setDoc(ref, newData);
    console.log("Done! Chapters are now ordered by Book Index.");
    process.exit(0);
}

main();
