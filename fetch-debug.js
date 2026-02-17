const https = require('https');

// Latest deployment URL from Step 1123
const baseUrl = 'https://react-dashboard-by-nirmala-main-p97yqd2bb-nirmala1.vercel.app';
const url = baseUrl + '/api/ai/summarize';

const postData = JSON.stringify({
    url: 'https://youtu.be/ll4sfbrsdn4?si=QZFbPdleHstisebA'
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log("Testing AI Summarizer: " + url);

const req = https.request(url, options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.transcript) {
                console.log("SUCCESS! Transcript found.");
                console.log("Transcript snippet:", json.transcript.substring(0, 100));
            } else if (json.error) {
                console.log("ERROR in JSON:", json.error);
            } else {
                console.log("UNKNOWN RESPONSE:", json);
            }

            if (json.summary) {
                console.log("Summary generated (length):", json.summary.length);
            }
        } catch (e) {
            console.log("Raw Body (Not JSON):");
            console.log(data.substring(0, 500));
        }
    });
});

req.on('error', (err) => {
    console.error("Error: " + err.message);
});

req.write(postData);
req.end();
