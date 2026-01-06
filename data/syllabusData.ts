
export interface Chapter {
    id: string;
    title: string;
    hindiTitle?: string;
    category?: string; // e.g. "Prose", "Poetry", "History"
}

export interface SubjectSyllabus {
    id: string;
    name: string;
    hindiName?: string;
    icon: string; // React-icon name or emoji
    color: string;
    chapters: Chapter[];
}

export const syllabusData: SubjectSyllabus[] = [
    {
        id: 'sanskrit',
        name: 'Sanskrit',
        hindiName: 'संस्कृत',
        icon: '🕉️',
        color: 'from-orange-500 to-amber-500',
        chapters: [
            // Literature - Piyusham
            { id: 'san-lit-1', title: 'Mangalacharanam', hindiTitle: 'मङ्गलाचरणम्', category: 'Literature' },
            { id: 'san-lit-2', title: 'Pataliputra Vaibhavam', hindiTitle: 'पाटलिपुत्रवैभवम्', category: 'Literature' },
            { id: 'san-lit-3', title: 'Alasyakatha', hindiTitle: 'आलस्यकथा', category: 'Literature' },
            { id: 'san-lit-4', title: 'Sanskrit Sahitye Lekhikah', hindiTitle: 'संस्कृतसाहित्या लेखिकाः', category: 'Literature' },
            { id: 'san-lit-5', title: 'Bharat Mahima', hindiTitle: 'भारतमहिमा', category: 'Literature' },
            { id: 'san-lit-6', title: 'Bharatiya Sanskarah', hindiTitle: 'भारतीयसंस्काराः', category: 'Literature' },
            { id: 'san-lit-7', title: 'Nitisloka', hindiTitle: 'नीतिश्लोकाः', category: 'Literature' },
            { id: 'san-lit-8', title: 'Karmavir Katha', hindiTitle: 'कर्मवीरकथा', category: 'Literature' },
            { id: 'san-lit-9', title: 'Swami Dayanand', hindiTitle: 'स्वामी दयानन्दः', category: 'Literature' },
            { id: 'san-lit-10', title: 'Mandakini Varnanam', hindiTitle: 'मन्दाकिनीवर्णनम्', category: 'Literature' },
            { id: 'san-lit-11', title: 'Vyaghrapathik Katha', hindiTitle: 'व्याघ्रपथिककथा', category: 'Literature' },
            { id: 'san-lit-12', title: 'Karnasya Danvirta', hindiTitle: 'कर्णस्य दानवीरता', category: 'Literature' },
            { id: 'san-lit-13', title: 'Vishwashanti', hindiTitle: 'विश्वशान्तिः', category: 'Literature' },
            { id: 'san-lit-14', title: 'Shastrakara', hindiTitle: 'शास्त्रकाराः', category: 'Literature' },
            // Grammar
            { id: 'san-gr-1', title: 'Sandhi', hindiTitle: 'संधिः (स्वर, व्यंजन, विसर्ग)', category: 'Grammar' },
            { id: 'san-gr-2', title: 'Samas', hindiTitle: 'समासः', category: 'Grammar' },
            { id: 'san-gr-3', title: 'Karak & Vibhakti', hindiTitle: 'कारक एवं विभक्ति', category: 'Grammar' },
            { id: 'san-gr-4', title: 'Shabda Rupani', hindiTitle: 'शब्दरूपाणि', category: 'Grammar' },
            { id: 'san-gr-5', title: 'Dhatu Rupani', hindiTitle: 'धातुरूपाणि', category: 'Grammar' },
            { id: 'san-gr-6', title: 'Upsarga', hindiTitle: 'उपसर्गाः', category: 'Grammar' },
            { id: 'san-gr-7', title: 'Pratyaya', hindiTitle: 'प्रत्ययाः', category: 'Grammar' },
            { id: 'san-gr-8', title: 'Avyaya', hindiTitle: 'अव्ययानि', category: 'Grammar' },
            { id: 'san-gr-9', title: 'Vakya Shuddhi', hindiTitle: 'वाक्यशुद्धिः', category: 'Grammar' },
            { id: 'san-gr-10', title: 'Apathit Gadyansh', hindiTitle: 'अपठित गद्यांशः', category: 'Grammar' },
            { id: 'san-gr-11', title: 'Anuvad', hindiTitle: 'अनुवादः', category: 'Grammar' },
        ]
    },
    {
        id: 'sst',
        name: 'Social Science',
        hindiName: 'सामाजिक विज्ञान',
        icon: '🌍',
        color: 'from-blue-500 to-indigo-500',
        chapters: [
            // History
            { id: 'hist-1', title: 'Nationalism in Europe', hindiTitle: 'यूरोप में राष्ट्रवाद', category: 'History' },
            { id: 'hist-2', title: 'Socialism & Communism', hindiTitle: 'समाजवाद एवं साम्यवाद', category: 'History' },
            { id: 'hist-3', title: 'Nationalist Movement in Indo-China', hindiTitle: 'हिन्द–चीन में राष्ट्रवादी आंदोलन', category: 'History' },
            { id: 'hist-4', title: 'Nationalism in India', hindiTitle: 'भारत में राष्ट्रवाद', category: 'History' },
            { id: 'hist-5', title: 'Economy and Livelihood', hindiTitle: 'अर्थव्यवस्था और आजीविका', category: 'History' },
            { id: 'hist-6', title: 'Urbanization & Urban Life', hindiTitle: 'शहरीकरण एवं शहरी जीवन', category: 'History' },
            { id: 'hist-7', title: 'Trade and Globalization', hindiTitle: 'व्यापार और भूमंडलीकरण', category: 'History' },
            { id: 'hist-8', title: 'Press & Cultural Nationalism', hindiTitle: 'प्रेस एवं सांस्कृतिक राष्ट्रवाद', category: 'History' },
            // Pol Sci
            { id: 'pol-1', title: 'Power Sharing in Democracy', hindiTitle: 'लोकतंत्र में सत्ता की साझेदारी', category: 'Political Science' },
            { id: 'pol-2', title: 'Functioning of Power Sharing', hindiTitle: 'सत्ता में साझेदारी की कार्यप्रणाली', category: 'Political Science' },
            { id: 'pol-3', title: 'Competition & Struggle', hindiTitle: 'लोकतंत्र में प्रतिस्पर्धा एवं संघर्ष', category: 'Political Science' },
            { id: 'pol-4', title: 'Achievements of Democracy', hindiTitle: 'लोकतंत्र की उपलब्धियाँ', category: 'Political Science' },
            { id: 'pol-5', title: 'Challenges to Democracy', hindiTitle: 'लोकतंत्र की चुनौतियाँ', category: 'Political Science' },
            // Economics
            { id: 'eco-1', title: 'Economy & Its Development', hindiTitle: 'अर्थव्यवस्था एवं इसके विकास का इतिहास', category: 'Economics' },
            { id: 'eco-2', title: 'State & National Income', hindiTitle: 'राज्य एवं राष्ट्र की आय', category: 'Economics' },
            { id: 'eco-3', title: 'Money, Savings & Credit', hindiTitle: 'मुद्रा, बचत एवं साख', category: 'Economics' },
            { id: 'eco-4', title: 'Our Financial Institutions', hindiTitle: 'हमारी वित्तीय संस्थाएँ', category: 'Economics' },
            { id: 'eco-5', title: 'Employment & Services', hindiTitle: 'रोजगार एवं सेवाएँ', category: 'Economics' },
            { id: 'eco-6', title: 'Globalization', hindiTitle: 'वैश्वीकरण', category: 'Economics' },
            { id: 'eco-7', title: 'Consumer Awareness', hindiTitle: 'उपभोक्ता जागरण एवं संरक्षण', category: 'Economics' },
            // Geography
            { id: 'geo-1', title: 'India: Resources & Utilization', hindiTitle: 'भारत : संसाधन एवं उपयोग', category: 'Geography' },
            { id: 'geo-2', title: 'Agriculture', hindiTitle: 'कृषि', category: 'Geography' },
            { id: 'geo-3', title: 'Manufacturing Industries', hindiTitle: 'निर्माण उद्योग', category: 'Geography' },
            { id: 'geo-4', title: 'Transport, Communication & Trade', hindiTitle: 'परिवहन, संचार एवं व्यापार', category: 'Geography' },
            { id: 'geo-5', title: 'Bihar: Agriculture & Forest', hindiTitle: 'बिहार : कृषि एवं वन संसाधन', category: 'Geography' },
            { id: 'geo-6', title: 'Map Study', hindiTitle: 'मानचित्र अध्ययन', category: 'Geography' },
            // Disaster Mgmt
            { id: 'dm-1', title: 'Disaster: Introduction', hindiTitle: 'प्राकृतिक आपदा : एक परिचय', category: 'Disaster Mgmt' },
            { id: 'dm-2', title: 'Flood & Drought', hindiTitle: 'बाढ़ एवं सुखाड़', category: 'Disaster Mgmt' },
            { id: 'dm-3', title: 'Earthquake & Tsunami', hindiTitle: 'भूकंप एवं सुनामी', category: 'Disaster Mgmt' },
            { id: 'dm-4', title: 'Life Saving Mgmt', hindiTitle: 'जीवन रक्षक आकस्मिक प्रबंधन', category: 'Disaster Mgmt' },
            { id: 'dm-5', title: 'Alt Communication', hindiTitle: 'आपदा काल में वैकल्पिक संचार व्यवस्था', category: 'Disaster Mgmt' },
            { id: 'dm-6', title: 'Disaster & Co-existence', hindiTitle: 'आपदा और सह–अस्तित्व', category: 'Disaster Mgmt' },
        ]
    },
    {
        id: 'science',
        name: 'Science',
        hindiName: 'विज्ञान',
        icon: '🧬',
        color: 'from-emerald-500 to-teal-500',
        chapters: [
            { id: 'sci-1', title: 'Chemical Reactions & Equations', hindiTitle: 'रासायनिक अभिक्रियाएँ एवं समीकरण', category: 'Chemistry' },
            { id: 'sci-2', title: 'Acids, Bases and Salts', hindiTitle: 'अम्ल, क्षारक एवं लवण', category: 'Chemistry' },
            { id: 'sci-3', title: 'Metals and Non-metals', hindiTitle: 'धातु एवं अधातु', category: 'Chemistry' },
            { id: 'sci-4', title: 'Carbon and its Compounds', hindiTitle: 'कार्बन एवं उसके यौगिक', category: 'Chemistry' },
            { id: 'sci-5', title: 'Periodic Classification', hindiTitle: 'तत्वों का आवर्त वर्गीकरण', category: 'Chemistry' },
            { id: 'sci-6', title: 'Life Processes', hindiTitle: 'जैव–प्रक्रम', category: 'Biology' },
            { id: 'sci-7', title: 'Control and Coordination', hindiTitle: 'नियंत्रण एवं समन्वय', category: 'Biology' },
            { id: 'sci-8', title: 'How do Organisms Reproduce?', hindiTitle: 'जीव जनन कैसे करते हैं', category: 'Biology' },
            { id: 'sci-9', title: 'Heredity and Evolution', hindiTitle: 'आनुवंशिकता एवं जैव–विकास', category: 'Biology' },
            { id: 'sci-10', title: 'Light – Reflection and Refraction', hindiTitle: 'प्रकाश – परावर्तन तथा अपवर्तन', category: 'Physics' },
            { id: 'sci-11', title: 'Human Eye and Colourful World', hindiTitle: 'मानव नेत्र तथा रंग–बिरंगा संसार', category: 'Physics' },
            { id: 'sci-12', title: 'Electricity', hindiTitle: 'विद्युत', category: 'Physics' },
            { id: 'sci-13', title: 'Magnetic Effects of Current', hindiTitle: 'विद्युत धारा के चुंबकीय प्रभाव', category: 'Physics' },
            { id: 'sci-14', title: 'Sources of Energy', hindiTitle: 'ऊर्जा के स्रोत', category: 'Physics' },
            { id: 'sci-15', title: 'Our Environment', hindiTitle: 'हमारा पर्यावरण', category: 'Biology' },
            { id: 'sci-16', title: 'Management of Natural Resources', hindiTitle: 'प्राकृतिक संसाधनों का प्रबंधन', category: 'Biology' }
        ]
    },
    {
        id: 'math',
        name: 'Mathematics',
        hindiName: 'गणित',
        icon: '📐',
        color: 'from-blue-600 to-indigo-600',
        chapters: [
            { id: 'math-1', title: 'Real Numbers', hindiTitle: 'वास्तविक संख्या', category: 'Math' },
            { id: 'math-2', title: 'Polynomials', hindiTitle: 'बहुपद', category: 'Math' },
            { id: 'math-3', title: 'Pair of Linear Equations', hindiTitle: 'दो चर वाले रैखिक समीकरण युग्म', category: 'Math' },
            { id: 'math-4', title: 'Quadratic Equations', hindiTitle: 'द्विघात समीकरण', category: 'Math' },
            { id: 'math-5', title: 'Arithmetic Progression', hindiTitle: 'समांतर श्रेढ़ियाँ', category: 'Math' },
            { id: 'math-6', title: 'Triangles', hindiTitle: 'त्रिभुज', category: 'Math' },
            { id: 'math-7', title: 'Coordinate Geometry', hindiTitle: 'निर्देशांक ज्यामिति', category: 'Math' },
            { id: 'math-8', title: 'Introduction to Trigonometry', hindiTitle: 'त्रिकोणमिति का परिचय', category: 'Math' },
            { id: 'math-9', title: 'Applications of Trigonometry', hindiTitle: 'त्रिकोणमिति के कुछ अनुप्रयोग', category: 'Math' },
            { id: 'math-10', title: 'Circles', hindiTitle: 'वृत्त', category: 'Math' },
            { id: 'math-11', title: 'Constructions', hindiTitle: 'रचनाएँ', category: 'Math' },
            { id: 'math-12', title: 'Areas Related to Circles', hindiTitle: 'वृत्तों से संबंधित क्षेत्रफल', category: 'Math' },
            { id: 'math-13', title: 'Surface Areas and Volumes', hindiTitle: 'पृष्ठीय क्षेत्रफल और आयतन', category: 'Math' },
            { id: 'math-14', title: 'Statistics', hindiTitle: 'सांख्यिकी', category: 'Math' },
            { id: 'math-15', title: 'Probability', hindiTitle: 'प्रायिकता', category: 'Math' }
        ]
    },
    {
        id: 'english',
        name: 'English',
        hindiName: 'English',
        icon: 'abc',
        color: 'from-violet-500 to-purple-500',
        chapters: [
            // Prose
            { id: 'eng-1', title: 'The Pace for Living', category: 'Prose' },
            { id: 'eng-2', title: 'Me and the Ecology Bit', category: 'Prose' },
            { id: 'eng-3', title: 'Gillu', category: 'Prose' },
            { id: 'eng-4', title: 'What is Wrong with Indian Film', category: 'Prose' },
            { id: 'eng-5', title: 'Acceptance Speech', category: 'Prose' },
            { id: 'eng-6', title: 'Once Upon a Time', category: 'Prose' },
            { id: 'eng-7', title: 'The Unity of Indian Culture', category: 'Prose' },
            { id: 'eng-8', title: 'Little Girl Wiser Than Men', category: 'Prose' },
            // Poetry
            { id: 'eng-p-1', title: 'God Made the Country', category: 'Poetry' },
            { id: 'eng-p-2', title: 'Ode on Solitude', category: 'Poetry' },
            { id: 'eng-p-3', title: 'Polythene Bag', category: 'Poetry' },
            { id: 'eng-p-4', title: 'Thinner Than a Crescent', category: 'Poetry' },
            { id: 'eng-p-5', title: 'The Empty Heart', category: 'Poetry' },
            { id: 'eng-p-6', title: 'Koel', category: 'Poetry' },
            { id: 'eng-p-7', title: 'The Sleeping Porter', category: 'Poetry' },
            { id: 'eng-p-8', title: 'Martha', category: 'Poetry' },
            // Supplementary
            { id: 'eng-s-1', title: 'January Night', category: 'Supplementary' },
            { id: 'eng-s-2', title: 'Allergy', category: 'Supplementary' },
            { id: 'eng-s-3', title: 'The Bet', category: 'Supplementary' },
            { id: 'eng-s-4', title: 'Quality', category: 'Supplementary' },
            { id: 'eng-s-5', title: 'Sun and Moon', category: 'Supplementary' },
            { id: 'eng-s-6', title: 'Two Horizons', category: 'Supplementary' },
            { id: 'eng-s-7', title: 'Love Defiled', category: 'Supplementary' },
            // Grammar
            { id: 'eng-g-1', title: 'Tenses, Modals, Voice, Clauses', category: 'Grammar' },
            { id: 'eng-g-2', title: 'Narration', category: 'Grammar' },
            { id: 'eng-g-3', title: 'Prepositions & Agreement', category: 'Grammar' },
            { id: 'eng-g-4', title: 'Translation & Writing', category: 'Grammar' },
        ]
    },
    {
        id: 'hindi',
        name: 'Hindi',
        hindiName: 'हिन्दी',
        icon: 'अ',
        color: 'from-amber-600 to-orange-600',
        chapters: [
            // Godhuli Prose
            { id: 'hin-1', title: 'Shram Vibhajan aur Jati Pratha', hindiTitle: 'श्रम विभाजन और जाति प्रथा', category: 'Godhuli Prose' },
            { id: 'hin-2', title: 'Vish ke Dant', hindiTitle: 'विष के दाँत', category: 'Godhuli Prose' },
            { id: 'hin-3', title: 'Bharat se Hum Kya Sikhe', hindiTitle: 'भारत से हम क्या सीखें', category: 'Godhuli Prose' },
            { id: 'hin-4', title: 'Nakhun Kyon Badhte Hain', hindiTitle: 'नाखून क्यों बढ़ते हैं', category: 'Godhuli Prose' },
            { id: 'hin-5', title: 'Nagari Lipi', hindiTitle: 'नागरी लिपि', category: 'Godhuli Prose' },
            { id: 'hin-6', title: 'Bahadur', hindiTitle: 'बहादुर', category: 'Godhuli Prose' },
            { id: 'hin-7', title: 'Parampara ka Mulyankan', hindiTitle: 'परंपरा का मूल्यांकन', category: 'Godhuli Prose' },
            { id: 'hin-8', title: 'Jit-Jit Main Nirkhat Hoon', hindiTitle: 'जित-जित मैं निरखत हूँ', category: 'Godhuli Prose' },
            { id: 'hin-9', title: 'Avinyo', hindiTitle: 'आविन्यों', category: 'Godhuli Prose' },
            { id: 'hin-10', title: 'Machli', hindiTitle: 'मछली', category: 'Godhuli Prose' },
            { id: 'hin-11', title: 'Naubatkhane Mein Ibadat', hindiTitle: 'नौबतखाने में इबादत', category: 'Godhuli Prose' },
            { id: 'hin-12', title: 'Shiksha aur Sanskriti', hindiTitle: 'शिक्षा और संस्कृति', category: 'Godhuli Prose' },
            // Godhuli Poetry
            { id: 'hin-p-1', title: 'Ram Bin Birthe Jagi Janma', hindiTitle: 'राम बिनु बिरथे जगि जनमा…', category: 'Godhuli Poetry' },
            { id: 'hin-p-2', title: 'Prem Ayani Shri Radhika', hindiTitle: 'प्रेम अयनि श्री राधिका…', category: 'Godhuli Poetry' },
            { id: 'hin-p-3', title: 'Ati Sudho Saneh ko Marg Hai', hindiTitle: 'अति सूधो सनेह को मारग है…', category: 'Godhuli Poetry' },
            { id: 'hin-p-4', title: 'Swadeshi', hindiTitle: 'स्वदेशी', category: 'Godhuli Poetry' },
            { id: 'hin-p-5', title: 'Bharat Mata', hindiTitle: 'भारतमाता', category: 'Godhuli Poetry' },
            { id: 'hin-p-6', title: 'Jantantra ka Janm', hindiTitle: 'जनतंत्र का जन्म', category: 'Godhuli Poetry' },
            { id: 'hin-p-7', title: 'Hiroshima', hindiTitle: 'हिरोशिमा', category: 'Godhuli Poetry' },
            { id: 'hin-p-8', title: 'Ek Vriksh ki Hatya', hindiTitle: 'एक वृक्ष की हत्या', category: 'Godhuli Poetry' },
            { id: 'hin-p-9', title: 'Hamari Neend', hindiTitle: 'हमारी नींद', category: 'Godhuli Poetry' },
            { id: 'hin-p-10', title: 'Akshar Gyan', hindiTitle: 'अक्षर–ज्ञान', category: 'Godhuli Poetry' },
            { id: 'hin-p-11', title: 'Lautkar AAunga Phir', hindiTitle: 'लौटकर आऊँगा फिर', category: 'Godhuli Poetry' },
            { id: 'hin-p-12', title: 'Mere Bina Tum Prabhu', hindiTitle: 'मेरे बिना तुम प्रभु', category: 'Godhuli Poetry' },
            // Varnika
            { id: 'hin-v-1', title: 'Dahi Wali Magamma', hindiTitle: 'दही वाली मंगम्मा', category: 'Varnika' },
            { id: 'hin-v-2', title: 'Dhatte Vishwas', hindiTitle: 'ढहते विश्वास', category: 'Varnika' },
            { id: 'hin-v-3', title: 'Maa', hindiTitle: 'माँ', category: 'Varnika' },
            { id: 'hin-v-4', title: 'Nagar', hindiTitle: 'नगर', category: 'Varnika' },
            { id: 'hin-v-5', title: 'Dharti Kab Tak Ghumegi', hindiTitle: 'धरती कब तक घूमेगी', category: 'Varnika' },
            // Grammar
            { id: 'hin-g-1', title: 'Apathit Gadyansh & Lekhan', hindiTitle: 'अपठित गद्यांश, पत्र, निबंध', category: 'Grammar' },
            { id: 'hin-g-2', title: 'Vyakaran (Sangya to Alankar)', hindiTitle: 'व्याकरण (संज्ञा से अलंकार)', category: 'Grammar' },
        ]
    }
];
