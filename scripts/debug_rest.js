// Native Fetch (Node 18+)
// URL: https://firestore.googleapis.com/v1/projects/{projectId}/databases/{databaseId}/documents/{collectionId}

const projectId = "aim-83922";
const collection = "debug_rest";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;

async function testRest() {
    console.log("Testing REST API write...");

    // Construct Firestore Document JSON format
    const body = {
        fields: {
            test: { booleanValue: true },
            timestamp: { integerValue: String(Date.now()) }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.ok) {
            console.log("REST Write SUCCESS!");
            process.exit(0);
        } else {
            console.error("REST Write FAILED.");
            process.exit(1);
        }
    } catch (e) {
        console.error("REST Error:", e);
        process.exit(1);
    }
}

testRest();
