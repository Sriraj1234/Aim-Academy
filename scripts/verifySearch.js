
const { search, SafeSearchType } = require('duck-duck-scrape');

async function testSearch() {
    const queries = ['cell', 'cell diagram', 'structure of cell'];

    for (const q of queries) {
        console.log(`\nTesting query: "${q}"...`);
        try {
            const results = await search(q, {
                safeSearch: SafeSearchType.STRICT,
                searchType: 'images'
            });

            console.log(`Found ${results.results.length} results.`);
            if (results.results.length > 0) {
                console.log('First result:', results.results[0].title);
            } else {
                console.log('No results found.');
            }
        } catch (e) {
            console.error('Error searching:', e.message);
        }
    }
}

testSearch();
