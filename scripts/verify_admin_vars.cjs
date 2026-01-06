require('dotenv').config({ path: '.env.local' });

const vars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
];

console.log('--- Admin Env Vars Check ---');
vars.forEach(v => {
    const val = process.env[v];
    if (val) {
        console.log(`[PASS] ${v}: Present (Len: ${val.length})`);
    } else {
        console.log(`[FAIL] ${v}: MISSING`);
    }
});
