
const { search } = require('google-sr');

async function testGoogleSearch() {
    try {
        console.log('Testing google-sr...');
        // Note: google-sr might behave differently. 
        // Typically returns a list of SearchResults.
        // For images, google-sr might not be specialized, but let's see if google-sr supports image results
        // or if we can accept web results for now.

        // Actually google-sr is mostly for web results. 
        // If we want images specifically, we might need a different query or look for image results in the output.

        const query = 'diagram of cell';
        const results = await search({
            query: query,
            safeSearch: true,
        });

        console.log(`Found ${results.length} results.`);
        if (results.length > 0) {
            console.log('First result:', results[0]);
        }
    } catch (e) {
        console.error('Error with google-sr:', e);
    }
}

testGoogleSearch();
