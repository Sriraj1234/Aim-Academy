const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
    message: "Hello AI",
    history: []
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Sending request to http://localhost:3000/api/ai/chat...");
const out = fs.createWriteStream('test_chat_log.txt');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    // Check for event stream
    if (res.headers['content-type']?.includes('text/event-stream')) {
        console.log("Confirmed Event Stream Response.");
    }

    res.on('data', (d) => {
        const chunk = d.toString();
        // Just print first 200 chars to avoid spam
        console.log("CHUNK:", chunk.substring(0, 200));
        out.write(chunk);
    });

    res.on('end', () => {
        console.log("\nResponse ended.");
        out.end();
    });
});

req.on('error', (error) => {
    console.error("ERROR:", error);
    out.write(`ERROR: ${error.message}`);
    out.end();
});

req.write(data);
req.end();
