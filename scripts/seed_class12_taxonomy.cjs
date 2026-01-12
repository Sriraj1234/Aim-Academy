const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const HINDI_CHAPTERS = [
    { name: 'Baat Cheet (बातचीत)', section: 'Prose', count: 10 },
    { name: 'Usne Kaha Tha (उसने कहा था)', section: 'Prose', count: 10 },
    { name: 'Sampurna Kranti (सम्पूर्ण क्रांति)', section: 'Prose', count: 10 },
    { name: 'Ardhnaarishwar (अर्धनारीश्वर)', section: 'Prose', count: 10 },
    { name: 'Roz (रोज)', section: 'Prose', count: 10 },
    { name: 'Ek Lekh Aur Ek Patra (एक लेख और एक पत्र)', section: 'Prose', count: 10 },
    { name: 'O Sadanira (ओ सदानीरा)', section: 'Prose', count: 10 },
    { name: 'Sipahi Ki Maa (सिपाही की माँ)', section: 'Prose', count: 10 },
    { name: 'Prageet Aur Samaj (प्रगीत और समाज)', section: 'Prose', count: 10 },
    { name: 'Joothan (जूठन)', section: 'Prose', count: 10 },
    { name: 'Hanste Hue Mera Akelapan (हँसते हुए मेरा अकेलापन)', section: 'Prose', count: 10 },
    { name: 'Tirichh (तिरिछ)', section: 'Prose', count: 10 },
    { name: 'Shiksha (शिक्षा)', section: 'Prose', count: 10 },
    { name: 'Kadbak (कड़बक)', section: 'Poetry', count: 10 },
    { name: 'Pad (पद - Surdas)', section: 'Poetry', count: 10 },
    { name: 'Pad (पद - Tulsidas)', section: 'Poetry', count: 10 },
    { name: 'Chhappay (छप्पय)', section: 'Poetry', count: 10 },
    { name: 'Kavitt (कवित्त)', section: 'Poetry', count: 10 },
    { name: 'Tumul Kolahal Kalah Mein (तुमुल कोलाहल कलह में)', section: 'Poetry', count: 10 },
    { name: 'Putra Viyog (पुत्र वियोग)', section: 'Poetry', count: 10 },
    { name: 'Usha (उषा)', section: 'Poetry', count: 10 },
    { name: 'Jan Jan Ka Chehra Ek (जन-जन का चेहरा एक)', section: 'Poetry', count: 10 },
    { name: 'Adhinayak (अधिनायक)', section: 'Poetry', count: 10 },
    { name: 'Pyare Nanhe Bete Ko (प्यारे नन्हे बेटे को)', section: 'Poetry', count: 10 },
    { name: 'Haar Jeet (हार-जीत)', section: 'Poetry', count: 10 },
    { name: 'Gaon Ka Ghar (गाँव का घर)', section: 'Poetry', count: 10 },
];

const ENGLISH_CHAPTERS = [
    { name: 'Indian Civilization and Culture', section: 'Prose', count: 10 },
    { name: 'Bharat is My Home', section: 'Prose', count: 10 },
    { name: 'A Pinch of Snuff', section: 'Prose', count: 10 },
    { name: 'I Have a Dream', section: 'Prose', count: 10 },
    { name: 'Ideas That Have Helped Mankind', section: 'Prose', count: 10 },
    { name: 'The Artist', section: 'Prose', count: 10 },
    { name: 'A Child is Born', section: 'Prose', count: 10 },
    { name: 'How Free is the Press', section: 'Prose', count: 10 },
    { name: 'The Earth', section: 'Prose', count: 10 },
    { name: 'India Through Travellers Eyes', section: 'Prose', count: 10 },
    { name: 'A Marriage Proposal', section: 'Prose', count: 10 },
    { name: 'Sweetest Love I Do Not Goe', section: 'Poetry', count: 10 },
    { name: 'Song of Myself', section: 'Poetry', count: 10 },
    { name: 'Now the Leaves Are Falling Fast', section: 'Poetry', count: 10 },
    { name: 'Ode to Autumn', section: 'Poetry', count: 10 },
    { name: 'An Epitaph', section: 'Poetry', count: 10 },
    { name: 'The Soldier', section: 'Poetry', count: 10 },
    { name: 'Macavity: The Mystery Cat', section: 'Poetry', count: 10 },
    { name: 'Fire-Hymn', section: 'Poetry', count: 10 },
    { name: 'Snake', section: 'Poetry', count: 10 },
    { name: 'My Grandmothers House', section: 'Poetry', count: 10 },
];

const STREAMS = {
    science: {
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Hindi', 'English'],
        chapters: {
            'Physics': [
                { name: 'Electric Charges and Fields', count: 10 },
                { name: 'Electrostatic Potential and Capacitance', count: 10 },
                { name: 'Current Electricity', count: 10 },
                { name: 'Moving Charges and Magnetism', count: 10 },
                { name: 'Magnetism and Matter', count: 10 },
                { name: 'Electromagnetic Induction', count: 10 },
                { name: 'Alternating Current', count: 10 },
                { name: 'Electromagnetic Waves', count: 10 },
                { name: 'Ray Optics and Optical Instruments', count: 10 },
                { name: 'Wave Optics', count: 10 },
                { name: 'Dual Nature of Radiation and Matter', count: 10 },
                { name: 'Atoms', count: 10 },
                { name: 'Nuclei', count: 10 },
                { name: 'Semiconductor Electronics', count: 10 },
            ],
            'Chemistry': [
                { name: 'The Solid State', count: 10 },
                { name: 'Solutions', count: 10 },
                { name: 'Electrochemistry', count: 10 },
                { name: 'Chemical Kinetics', count: 10 },
                { name: 'Surface Chemistry', count: 10 },
                { name: 'General Principles of Isolation of Elements', count: 10 },
                { name: 'The p-Block Elements', count: 10 },
                { name: 'The d and f Block Elements', count: 10 },
                { name: 'Coordination Compounds', count: 10 },
                { name: 'Haloalkanes and Haloarenes', count: 10 },
                { name: 'Alcohols, Phenols and Ethers', count: 10 },
                { name: 'Aldehydes, Ketones and Carboxylic Acids', count: 10 },
                { name: 'Amines', count: 10 },
                { name: 'Biomolecules', count: 10 },
                { name: 'Polymers', count: 10 },
                { name: 'Chemistry in Everyday Life', count: 10 },
            ],
            'Mathematics': [
                { name: 'Relations and Functions', count: 10 },
                { name: 'Inverse Trigonometric Functions', count: 10 },
                { name: 'Matrices', count: 10 },
                { name: 'Determinants', count: 10 },
                { name: 'Continuity and Differentiability', count: 10 },
                { name: 'Application of Derivatives', count: 10 },
                { name: 'Integrals', count: 10 },
                { name: 'Application of Integrals', count: 10 },
                { name: 'Differential Equations', count: 10 },
                { name: 'Vector Algebra', count: 10 },
                { name: 'Three Dimensional Geometry', count: 10 },
                { name: 'Linear Programming', count: 10 },
                { name: 'Probability', count: 10 },
            ],
            'Biology': [
                { name: 'Reproduction in Organisms', count: 10 },
                { name: 'Sexual Reproduction in Flowering Plants', count: 10 },
                { name: 'Human Reproduction', count: 10 },
                { name: 'Reproductive Health', count: 10 },
                { name: 'Principles of Inheritance and Variation', count: 10 },
                { name: 'Molecular Basis of Inheritance', count: 10 },
                { name: 'Evolution', count: 10 },
                { name: 'Human Health and Disease', count: 10 },
                { name: 'Strategies for Enhancement in Food Production', count: 10 },
                { name: 'Microbes in Human Welfare', count: 10 },
                { name: 'Biotechnology: Principles and Processes', count: 10 },
                { name: 'Biotechnology and its Applications', count: 10 },
                { name: 'Organisms and Populations', count: 10 },
                { name: 'Ecosystem', count: 10 },
                { name: 'Biodiversity and Conservation', count: 10 },
                { name: 'Environmental Issues', count: 10 },
            ],
            'Hindi': HINDI_CHAPTERS,
            'English': ENGLISH_CHAPTERS,
        }
    },
    arts: {
        subjects: ['History', 'Geography', 'Political Science', 'Economics', 'Psychology', 'Sociology', 'Hindi', 'English'],
        chapters: {
            'History': [
                { name: 'Bricks, Beads and Bones', count: 10 },
                { name: 'Kings, Farmers and Towns', count: 10 },
                { name: 'Kinship, Caste and Class', count: 10 },
                { name: 'Thinkers, Beliefs and Buildings', count: 10 },
                { name: 'Through the Eyes of Travellers', count: 10 },
                { name: 'Bhakti-Sufi Traditions', count: 10 },
                { name: 'An Imperial Capital: Vijayanagara', count: 10 },
                { name: 'Peasants, Zamindars and the State', count: 10 },
                { name: 'Kings and Chronicles', count: 10 },
                { name: 'Colonialism and the Countryside', count: 10 },
                { name: 'Rebels and the Raj', count: 10 },
                { name: 'Colonial Cities', count: 10 },
                { name: 'Mahatma Gandhi and the Nationalist Movement', count: 10 },
                { name: 'Understanding Partition', count: 10 },
                { name: 'Framing the Constitution', count: 10 },
            ],
            'Geography': [
                { name: 'Human Geography: Nature and Scope', count: 10 },
                { name: 'The World Population', count: 10 },
                { name: 'Population Composition', count: 10 },
                { name: 'Human Development', count: 10 },
                { name: 'Primary Activities', count: 10 },
                { name: 'Secondary Activities', count: 10 },
                { name: 'Tertiary and Quaternary Activities', count: 10 },
                { name: 'Transport and Communication', count: 10 },
                { name: 'International Trade', count: 10 },
                { name: 'Human Settlements', count: 10 },
            ],
            'Political Science': [
                { name: 'The Cold War Era', count: 10 },
                { name: 'The End of Bipolarity', count: 10 },
                { name: 'US Hegemony in World Politics', count: 10 },
                { name: 'Alternative Centres of Power', count: 10 },
                { name: 'Contemporary South Asia', count: 10 },
                { name: 'International Organisations', count: 10 },
                { name: 'Security in the Contemporary World', count: 10 },
                { name: 'Environment and Natural Resources', count: 10 },
                { name: 'Globalisation', count: 10 },
                { name: 'Challenges of Nation Building', count: 10 },
                { name: 'Era of One Party Dominance', count: 10 },
                { name: 'Politics of Planned Development', count: 10 },
                { name: 'Indias External Relations', count: 10 },
                { name: 'Challenges to the Congress System', count: 10 },
                { name: 'Crisis of Democratic Order', count: 10 },
                { name: 'Rise of Popular Movements', count: 10 },
                { name: 'Regional Aspirations', count: 10 },
                { name: 'Recent Developments in Indian Politics', count: 10 },
            ],
            'Economics': [
                { name: 'Introduction to Microeconomics', count: 10 },
                { name: 'Theory of Consumer Behaviour', count: 10 },
                { name: 'Production and Costs', count: 10 },
                { name: 'The Theory of the Firm under Perfect Competition', count: 10 },
                { name: 'Market Equilibrium', count: 10 },
                { name: 'Non-Competitive Markets', count: 10 },
                { name: 'Introduction to Macroeconomics', count: 10 },
                { name: 'National Income Accounting', count: 10 },
                { name: 'Money and Banking', count: 10 },
                { name: 'Determination of Income and Employment', count: 10 },
                { name: 'Government Budget and the Economy', count: 10 },
                { name: 'Open Economy Macroeconomics', count: 10 },
            ],
            'Psychology': [],
            'Sociology': [],
            'Hindi': HINDI_CHAPTERS,
            'English': ENGLISH_CHAPTERS,
        }
    },
    commerce: {
        subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Hindi', 'English'],
        chapters: {
            'Accountancy': [
                { name: 'Accounting for Not-for-Profit Organisation', count: 10 },
                { name: 'Accounting for Partnership: Basic Concepts', count: 10 },
                { name: 'Reconstitution of a Partnership Firm: Admission of a Partner', count: 10 },
                { name: 'Reconstitution of a Partnership Firm: Retirement/Death of a Partner', count: 10 },
                { name: 'Dissolution of Partnership Firm', count: 10 },
                { name: 'Accounting for Share Capital', count: 10 },
                { name: 'Issue and Redemption of Debentures', count: 10 },
                { name: 'Financial Statements of a Company', count: 10 },
                { name: 'Analysis of Financial Statements', count: 10 },
                { name: 'Accounting Ratios', count: 10 },
                { name: 'Cash Flow Statement', count: 10 },
            ],
            'Business Studies': [
                { name: 'Nature and Significance of Management', count: 10 },
                { name: 'Principles of Management', count: 10 },
                { name: 'Business Environment', count: 10 },
                { name: 'Planning', count: 10 },
                { name: 'Organising', count: 10 },
                { name: 'Staffing', count: 10 },
                { name: 'Directing', count: 10 },
                { name: 'Controlling', count: 10 },
                { name: 'Financial Management', count: 10 },
                { name: 'Financial Markets', count: 10 },
                { name: 'Marketing Management', count: 10 },
                { name: 'Consumer Protection', count: 10 },
            ],
            'Economics': [
                { name: 'Introduction to Microeconomics', count: 10 },
                { name: 'Theory of Consumer Behaviour', count: 10 },
                { name: 'Production and Costs', count: 10 },
                { name: 'The Theory of the Firm under Perfect Competition', count: 10 },
                { name: 'Market Equilibrium', count: 10 },
                { name: 'Non-Competitive Markets', count: 10 },
                { name: 'Introduction to Macroeconomics', count: 10 },
                { name: 'National Income Accounting', count: 10 },
                { name: 'Money and Banking', count: 10 },
                { name: 'Determination of Income and Employment', count: 10 },
                { name: 'Government Budget and the Economy', count: 10 },
                { name: 'Open Economy Macroeconomics', count: 10 },
            ],
            'Mathematics': [
                { name: 'Relations and Functions', count: 10 },
                { name: 'Inverse Trigonometric Functions', count: 10 },
                { name: 'Matrices', count: 10 },
                { name: 'Determinants', count: 10 },
                { name: 'Continuity and Differentiability', count: 10 },
                { name: 'Application of Derivatives', count: 10 },
                { name: 'Integrals', count: 10 },
                { name: 'Application of Integrals', count: 10 },
                { name: 'Differential Equations', count: 10 },
                { name: 'Vector Algebra', count: 10 },
                { name: 'Three Dimensional Geometry', count: 10 },
                { name: 'Linear Programming', count: 10 },
                { name: 'Probability', count: 10 },
            ],
            'Hindi': HINDI_CHAPTERS,
            'English': ENGLISH_CHAPTERS,
        }
    }
};

async function seed() {
    console.log("Seeding taxonomy...");
    const docRef = doc(db, 'metadata', 'taxonomy');

    const updateData = {};

    for (const [streamName, data] of Object.entries(STREAMS)) {
        updateData[`bseb_12_${streamName}`] = data;
        console.log(`Prepared bseb_12_${streamName}`);
    }

    try {
        await setDoc(docRef, updateData, { merge: true });
        console.log('Successfully updated taxonomy for BSEB Class 12 Streams!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating taxonomy:', error);
        process.exit(1);
    }
}

seed();
