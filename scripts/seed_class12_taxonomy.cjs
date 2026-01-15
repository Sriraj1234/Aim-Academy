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
                { name: 'Electric Charges and Fields (वैद्युत आवेश तथा क्षेत्र)', count: 10 },
                { name: 'Electrostatic Potential and Capacitance (स्थिरवैद्युत विभव तथा धारिता)', count: 10 },
                { name: 'Current Electricity (विद्युत धारा)', count: 10 },
                { name: 'Moving Charges and Magnetism (गतिमान आवेश और चुंबकत्व)', count: 10 },
                { name: 'Magnetism and Matter (चुंबकत्व एवं द्रव्य)', count: 10 },
                { name: 'Electromagnetic Induction (वैद्युतचुंबकीय प्रेरण)', count: 10 },
                { name: 'Alternating Current (प्रत्यावर्ती धारा)', count: 10 },
                { name: 'Electromagnetic Waves (वैद्युतचुंबकीय तरंगें)', count: 10 },
                { name: 'Ray Optics and Optical Instruments (किरण प्रकाशिकी एवं प्रकाशिक यंत्र)', count: 10 },
                { name: 'Wave Optics (तरंग-प्रकाशिकी)', count: 10 },
                { name: 'Dual Nature of Radiation and Matter (विकिरण तथा द्रव्य की द्वैत प्रकृति)', count: 10 },
                { name: 'Atoms (परमाणु)', count: 10 },
                { name: 'Nuclei (नाभिक)', count: 10 },
                { name: 'Semiconductor Electronics (अर्धचालक इलेक्ट्रॉनिकी)', count: 10 },
            ],
            'Chemistry': [
                { name: 'The Solid State (ठोस अवस्था)', count: 10 },
                { name: 'Solutions (विलयन)', count: 10 },
                { name: 'Electrochemistry (वैद्युतरसायन)', count: 10 },
                { name: 'Chemical Kinetics (रासायनिक बलगतिकी)', count: 10 },
                { name: 'Surface Chemistry (पृष्ठ रसायन)', count: 10 },
                { name: 'General Principles of Isolation of Elements (तत्वों के निष्कर्षण के सिद्धांत)', count: 10 },
                { name: 'The p-Block Elements (p-ब्लॉक के तत्व)', count: 10 },
                { name: 'The d and f Block Elements (d एवं f ब्लॉक के तत्व)', count: 10 },
                { name: 'Coordination Compounds (उपसहसंयोजन यौगिक)', count: 10 },
                { name: 'Haloalkanes and Haloarenes (हैलोएल्केन तथा हैलोएरीन)', count: 10 },
                { name: 'Alcohols, Phenols and Ethers (एल्कोहल, फिनॉल एवं ईथर)', count: 10 },
                { name: 'Aldehydes, Ketones and Carboxylic Acids (एल्डिहाइड, कीटोन एवं अम्ल)', count: 10 },
                { name: 'Amines (एमीन)', count: 10 },
                { name: 'Biomolecules (जैव-अणु)', count: 10 },
                { name: 'Polymers (बहुलक)', count: 10 },
                { name: 'Chemistry in Everyday Life (दैनिक जीवन में रसायन)', count: 10 },
            ],
            'Mathematics': [
                { name: 'Relations and Functions (संबंध एवं फलन)', count: 10 },
                { name: 'Inverse Trigonometric Functions (प्रतिलोम त्रिकोणमितीय फलन)', count: 10 },
                { name: 'Matrices (आव्यूह)', count: 10 },
                { name: 'Determinants (सारणिक)', count: 10 },
                { name: 'Continuity and Differentiability (सांतत्य तथा अवकलनीयता)', count: 10 },
                { name: 'Application of Derivatives (अवकलज के अनुप्रयोग)', count: 10 },
                { name: 'Integrals (समाकलन)', count: 10 },
                { name: 'Application of Integrals (समाकलन के अनुप्रयोग)', count: 10 },
                { name: 'Differential Equations (अवकल समीकरण)', count: 10 },
                { name: 'Vector Algebra (सदिश बीजगणित)', count: 10 },
                { name: 'Three Dimensional Geometry (त्रिविमीय ज्यामिति)', count: 10 },
                { name: 'Linear Programming (रैखिक प्रोग्रामन)', count: 10 },
                { name: 'Probability (प्रायिकता)', count: 10 },
            ],
            'Biology': [
                { name: 'Reproduction in Organisms (जीवों में जनन)', count: 10 },
                { name: 'Sexual Reproduction in Flowering Plants (पुष्पी पादपों में लैंगिक जनन)', count: 10 },
                { name: 'Human Reproduction (मानव जनन)', count: 10 },
                { name: 'Reproductive Health (जनन स्वास्थ्य)', count: 10 },
                { name: 'Principles of Inheritance and Variation (वंशागति तथा विविधता के सिद्धांत)', count: 10 },
                { name: 'Molecular Basis of Inheritance (वंशागति के आणविक आधार)', count: 10 },
                { name: 'Evolution (विकास)', count: 10 },
                { name: 'Human Health and Disease (मानव स्वास्थ्य तथा रोग)', count: 10 },
                { name: 'Strategies for Enhancement in Food Production (खाद्य उत्पादन में वृद्धि)', count: 10 },
                { name: 'Microbes in Human Welfare (मानव कल्याण में सूक्ष्मजीव)', count: 10 },
                { name: 'Biotechnology: Principles and Processes (जैव प्रौद्योगिकी: सिद्धांत एवं प्रक्रम)', count: 10 },
                { name: 'Biotechnology and its Applications (जैव प्रौद्योगिकी एवं उसके उपयोग)', count: 10 },
                { name: 'Organisms and Populations (जीव और समष्टियाँ)', count: 10 },
                { name: 'Ecosystem (पारितंत्र)', count: 10 },
                { name: 'Biodiversity and Conservation (जैव विविधता एवं संरक्षण)', count: 10 },
                { name: 'Environmental Issues (पर्यावरण के मुद्दे)', count: 10 },
            ],
            'Hindi': HINDI_CHAPTERS,
            'English': ENGLISH_CHAPTERS,
        }
    },
    arts: {
        subjects: ['History', 'Geography', 'Political Science', 'Economics', 'Psychology', 'Sociology', 'Hindi', 'English'],
        chapters: {
            'History': [
                { name: 'Bricks, Beads and Bones (ईंटें, मनके तथा अस्थियाँ)', count: 10 },
                { name: 'Kings, Farmers and Towns (राजा, किसान और नगर)', count: 10 },
                { name: 'Kinship, Caste and Class (बंधुत्व, जाति तथा वर्ग)', count: 10 },
                { name: 'Thinkers, Beliefs and Buildings ( विचारक, विश्वास और इमारतें)', count: 10 },
                { name: 'Through the Eyes of Travellers (यात्रियों के नज़रिए)', count: 10 },
                { name: 'Bhakti-Sufi Traditions (भक्ति-सूफ़ी परंपराएँ)', count: 10 },
                { name: 'An Imperial Capital: Vijayanagara (एक साम्राज्य की राजधानी : विजयनगर)', count: 10 },
                { name: 'Peasants, Zamindars and the State (किसान, जमींदार और राज्य)', count: 10 },
                { name: 'Kings and Chronicles (राजा और विभिन्न वृतांत)', count: 10 },
                { name: 'Colonialism and the Countryside (उपनिवेशवाद और देहात)', count: 10 },
                { name: 'Rebels and the Raj (विद्रोही और राज)', count: 10 },
                { name: 'Colonial Cities (औपनिवेशिक शहर)', count: 10 },
                { name: 'Mahatma Gandhi and the Nationalist Movement (महात्मा गाँधी और राष्ट्रीय आंदोलन)', count: 10 },
                { name: 'Understanding Partition (विभाजन को समझना)', count: 10 },
                { name: 'Framing the Constitution (संविधान का निर्माण)', count: 10 },
            ],
            'Geography': [
                { name: 'Human Geography: Nature and Scope (मानव भूगोल: प्रकृति एवं विषय क्षेत्र)', count: 10 },
                { name: 'The World Population (विश्व जनसंख्या)', count: 10 },
                { name: 'Population Composition (जनसंख्या संघटन)', count: 10 },
                { name: 'Human Development (मानव विकास)', count: 10 },
                { name: 'Primary Activities (प्राथमिक क्रियाएँ)', count: 10 },
                { name: 'Secondary Activities (द्वितीयक क्रियाएँ)', count: 10 },
                { name: 'Tertiary and Quaternary Activities (तृतीयक और चतुर्थ क्रियाकलाप)', count: 10 },
                { name: 'Transport and Communication (परिवहन एवं संचार)', count: 10 },
                { name: 'International Trade (अंतर्राष्ट्रीय व्यापार)', count: 10 },
                { name: 'Human Settlements (मानव बस्ती)', count: 10 },
            ],
            'Political Science': [
                { name: 'The Cold War Era (शीतयुद्ध का दौर)', count: 10 },
                { name: 'The End of Bipolarity (दो ध्रुवीयता का अंत)', count: 10 },
                { name: 'US Hegemony in World Politics (समकालीन विश्व में अमेरिकी वर्चस्व)', count: 10 },
                { name: 'Alternative Centres of Power (सत्ता के वैकल्पिक केन्द्र)', count: 10 },
                { name: 'Contemporary South Asia (समकालीन दक्षिण एशिया)', count: 10 },
                { name: 'International Organisations (अंतर्राष्ट्रीय संगठन)', count: 10 },
                { name: 'Security in the Contemporary World (समकालीन विश्व में सुरक्षा)', count: 10 },
                { name: 'Environment and Natural Resources (पर्यावरण और प्राकृतिक संसाधन)', count: 10 },
                { name: 'Globalisation (वैश्वीकरण)', count: 10 },
                { name: 'Challenges of Nation Building (राष्ट्र निर्माण की चुनौतियाँ)', count: 10 },
                { name: 'Era of One Party Dominance (एक दल के प्रभुत्व का दौर)', count: 10 },
                { name: 'Politics of Planned Development (नियोजित विकास की राजनीति)', count: 10 },
                { name: 'Indias External Relations (भारत के विदेश संबंध)', count: 10 },
                { name: 'Challenges to the Congress System (कांग्रेस प्रणाली: चुनौतियाँ और पुनर्स्थापना)', count: 10 },
                { name: 'Crisis of Democratic Order (लोकतांत्रिक व्यवस्था का संकट)', count: 10 },
                { name: 'Rise of Popular Movements (जन आंदोलनों का उदय)', count: 10 },
                { name: 'Regional Aspirations (क्षेत्रीय आकांक्षाएँ)', count: 10 },
                { name: 'Recent Developments in Indian Politics (भारतीय राजनीति: नए बदलाव)', count: 10 },
            ],
            'Economics': [
                { name: 'Introduction to Microeconomics (व्यष्टि अर्थशास्त्र - परिचय)', count: 10 },
                { name: 'Theory of Consumer Behaviour (उपभोक्ता के व्यवहार का सिद्धांत)', count: 10 },
                { name: 'Production and Costs (उत्पादन तथा लागत)', count: 10 },
                { name: 'The Theory of the Firm under Perfect Competition (पूर्ण प्रतिस्पर्धा में फर्म का सिद्धांत)', count: 10 },
                { name: 'Market Equilibrium (बाज़ार संतुलन)', count: 10 },
                { name: 'Non-Competitive Markets (प्रतिस्पर्धारहित बाज़ार)', count: 10 },
                { name: 'Introduction to Macroeconomics (समष्टि अर्थशास्त्र - परिचय)', count: 10 },
                { name: 'National Income Accounting (राष्ट्रीय आय का लेखांकन)', count: 10 },
                { name: 'Money and Banking (मुद्रा और बैंकिंग)', count: 10 },
                { name: 'Determination of Income and Employment (आय और रोजगार का निर्धारण)', count: 10 },
                { name: 'Government Budget and the Economy (सरकारी बजट और अर्थव्यवस्था)', count: 10 },
                { name: 'Open Economy Macroeconomics (खुली अर्थव्यवस्था - समष्टि अर्थशास्त्र)', count: 10 },
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
                { name: 'Accounting for Not-for-Profit Organisation (अलाभकारी संस्थाओं के लिए लेखांकन)', count: 10 },
                { name: 'Accounting for Partnership: Basic Concepts (साझेदारी लेखांकन: आधारभूत अवधारणाएँ)', count: 10 },
                { name: 'Reconstitution of a Partnership Firm: Admission of a Partner (साझेदारी का पुनर्गठन: साझेदार का प्रवेश)', count: 10 },
                { name: 'Reconstitution of a Partnership Firm: Retirement/Death of a Partner (साझेदार की सेवानिवृत्ति/मृत्यु)', count: 10 },
                { name: 'Dissolution of Partnership Firm (साझेदारी फर्म का विघटन)', count: 10 },
                { name: 'Accounting for Share Capital (अंश पूँजी के लिए लेखांकन)', count: 10 },
                { name: 'Issue and Redemption of Debentures (ऋणपत्रों का निर्गमन एवं मोचन)', count: 10 },
                { name: 'Financial Statements of a Company (कंपनी के वित्तीय विवरण)', count: 10 },
                { name: 'Analysis of Financial Statements (वित्तीय विवरणों का विश्लेषण)', count: 10 },
                { name: 'Accounting Ratios (लेखांकन अनुपात)', count: 10 },
                { name: 'Cash Flow Statement (रोकड़ प्रवाह विवरण)', count: 10 },
            ],
            'Business Studies': [
                { name: 'Nature and Significance of Management (प्रबंध की प्रकृति एवं महत्व)', count: 10 },
                { name: 'Principles of Management (प्रबंध के सिद्धांत)', count: 10 },
                { name: 'Business Environment (व्यावसायिक पर्यावरण)', count: 10 },
                { name: 'Planning (नियोजन)', count: 10 },
                { name: 'Organising (संगठन)', count: 10 },
                { name: 'Staffing (नियुक्तीकरण)', count: 10 },
                { name: 'Directing (निर्देशन)', count: 10 },
                { name: 'Controlling (नियंत्रण)', count: 10 },
                { name: 'Financial Management (वित्तीय प्रबंध)', count: 10 },
                { name: 'Financial Markets (वित्तीय बाज़ार)', count: 10 },
                { name: 'Marketing Management (विपणन प्रबंध)', count: 10 },
                { name: 'Consumer Protection (उपभोक्ता संरक्षण)', count: 10 },
            ],
            'Economics': [
                { name: 'Introduction to Microeconomics (व्यष्टि अर्थशास्त्र - परिचय)', count: 10 },
                { name: 'Theory of Consumer Behaviour (उपभोक्ता के व्यवहार का सिद्धांत)', count: 10 },
                { name: 'Production and Costs (उत्पादन तथा लागत)', count: 10 },
                { name: 'The Theory of the Firm under Perfect Competition (पूर्ण प्रतिस्पर्धा में फर्म का सिद्धांत)', count: 10 },
                { name: 'Market Equilibrium (बाज़ार संतुलन)', count: 10 },
                { name: 'Non-Competitive Markets (प्रतिस्पर्धारहित बाज़ार)', count: 10 },
                { name: 'Introduction to Macroeconomics (समष्टि अर्थशास्त्र - परिचय)', count: 10 },
                { name: 'National Income Accounting (राष्ट्रीय आय का लेखांकन)', count: 10 },
                { name: 'Money and Banking (मुद्रा और बैंकिंग)', count: 10 },
                { name: 'Determination of Income and Employment (आय और रोजगार का निर्धारण)', count: 10 },
                { name: 'Government Budget and the Economy (सरकारी बजट और अर्थव्यवस्था)', count: 10 },
                { name: 'Open Economy Macroeconomics (खुली अर्थव्यवस्था - समष्टि अर्थशास्त्र)', count: 10 },
            ],
            'Mathematics': [
                { name: 'Relations and Functions (संबंध एवं फलन)', count: 10 },
                { name: 'Inverse Trigonometric Functions (प्रतिलोम त्रिकोणमितीय फलन)', count: 10 },
                { name: 'Matrices (आव्यूह)', count: 10 },
                { name: 'Determinants (सारणिक)', count: 10 },
                { name: 'Continuity and Differentiability (सांतत्य तथा अवकलनीयता)', count: 10 },
                { name: 'Application of Derivatives (अवकलज के अनुप्रयोग)', count: 10 },
                { name: 'Integrals (समाकलन)', count: 10 },
                { name: 'Application of Integrals (समाकलन के अनुप्रयोग)', count: 10 },
                { name: 'Differential Equations (अवकल समीकरण)', count: 10 },
                { name: 'Vector Algebra (सदिश बीजगणित)', count: 10 },
                { name: 'Three Dimensional Geometry (त्रिविमीय ज्यामिति)', count: 10 },
                { name: 'Linear Programming (रैखिक प्रोग्रामन)', count: 10 },
                { name: 'Probability (प्रायिकता)', count: 10 },
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
