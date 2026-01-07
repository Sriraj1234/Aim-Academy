const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

if (!admin.apps.length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
            privateKey = privateKey.replace(/\\n/g, '\n');
        }
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
    } catch (e) {
        console.error("Init Error:", e.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function createTestQuizzes() {
    try {
        const now = Date.now();

        // 1. Live Now Quiz
        const liveQuiz = {
            title: "General Knowledge Blast",
            description: "Test your GK in this rapid-fire round!",
            type: "DAILY BATTLE",
            startTime: now - (1000 * 60 * 5), // Started 5 mins ago
            endTime: now + (1000 * 60 * 25), // Ends in 25 mins
            duration: 30,
            status: 'active'
        };

        // 2. Upcoming Quiz
        const upcomingQuiz = {
            title: "Science & Tech Weekly",
            description: "Deep dive into Physics and Chemistry.",
            type: "WEEKLY MEGA",
            startTime: now + (1000 * 60 * 60 * 2), // Starts in 2 hours
            endTime: now + (1000 * 60 * 60 * 3), // Ends in 3 hours
            duration: 60,
            status: 'scheduled'
        };

        await db.collection('live_quizzes').add(liveQuiz);
        console.log("Added Live Quiz");

        await db.collection('live_quizzes').add(upcomingQuiz);
        console.log("Added Upcoming Quiz");

        console.log("Done!");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

createTestQuizzes();
