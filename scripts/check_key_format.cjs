const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
// We use fs to read raw file to see if it's quoted or not
const rawEnv = fs.readFileSync(envPath, 'utf8');
const keyLine = rawEnv.split('\n').find(line => line.startsWith('FIREBASE_PRIVATE_KEY='));

if (!keyLine) {
    console.log('Key NOT found in raw file');
} else {
    console.log('Raw line starts with:', keyLine.substring(0, 50));
    console.log('Raw line contains quotes?', keyLine.includes('"'));
    console.log('Raw line contains literal backslash-n?', keyLine.includes('\\n'));
}

const config = dotenv.parse(rawEnv);
const parsedKey = config.FIREBASE_PRIVATE_KEY;

if (parsedKey) {
    console.log('Parsed Key Length:', parsedKey.length);
    console.log('Parsed Key contains literal newline (\\n char)?', parsedKey.includes('\n'));
    console.log('Parsed Key contains escaped newline (\\\\n)?', parsedKey.includes('\\n'));
} else {
    console.log('Parsed Key is MISSING');
}
