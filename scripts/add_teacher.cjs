const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.error("❌ Error: Missing Firebase credentials in .env.local");
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        })
    });
}

const db = admin.firestore();

async function addTeacher(email, name) {
    if (!email) {
        console.error('Please provide an email');
        return;
    }

    const emailKey = email.toLowerCase().trim();

    const teacherData = {
        email: emailKey,
        name: name || 'Admin Teacher',
        subject: 'All Subjects',
        phone: '',
        authorizedBy: 'SYSTEM_SCRIPT',
        authorizedAt: Date.now(),
        status: 'active'
    };

    try {
        await db.collection('teachers').doc(emailKey).set(teacherData);
        console.log(`✅ Success! ${email} is now an Authorized Teacher.`);
        console.log('👉 Go to: http://localhost:3000/teachers/admin');
    } catch (error) {
        console.error('❌ Error adding teacher:', error);
    }
}

const args = process.argv.slice(2);
const email = args[0];
const name = args[1];

if (args.length === 0) {
    console.log('Usage: node scripts/add_teacher.cjs <email> [name]');
    console.log('Example: node scripts/add_teacher.cjs jayant@gmail.com "Jayant Kumar"');
} else {
    addTeacher(email, name);
}
