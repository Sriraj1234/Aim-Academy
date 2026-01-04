const { GOOGLE_IMG_SCRAP } = require('google-img-scrap');

const args = process.argv.slice(2);
const query = args[0];
const type = args[1] || 'text';

async function run() {
    if (!query) {
        console.log(JSON.stringify({ error: 'No query provided' }));
        return;
    }

    try {
        const result = await GOOGLE_IMG_SCRAP({
            search: query,
            limit: type === 'image' ? 10 : 5,
            safeSearch: true,
            excludeDomains: ["stock.adobe.com", "shutterstock.com", "alamy.com", "istockphoto.com"]
        });

        if (result && result.result) {
            console.log(JSON.stringify(result.result));
        } else {
            console.log(JSON.stringify([]));
        }
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

run();
