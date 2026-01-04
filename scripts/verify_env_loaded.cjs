require('dotenv').config({ path: '.env.local' });

console.log('--- Env Var Check ---');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present (Len: ' + process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length + ')' : 'MISSING');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Present' : 'MISSING');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Present' : 'MISSING');
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Present' : 'MISSING');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Present (Len: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'MISSING');
