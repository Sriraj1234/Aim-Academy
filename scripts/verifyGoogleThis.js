
const google = require('googlethis');

async function testGoogleThis() {
    try {
        console.log('Testing googlethis image search...');
        const query = 'diagram of cell';
        const images = await google.image(query, { safe: true });

        console.log(`Found ${images.length} results.`);
        if (images.length > 0) {
            console.log('First result:', images[0]);
        } else {
            console.log('No results found.');
        }
    } catch (e) {
        console.error('Error with googlethis:', e);
    }
}

testGoogleThis();
