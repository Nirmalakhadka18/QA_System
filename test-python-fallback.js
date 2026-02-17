const https = require('https');

// Deployment URL from Step 1215 (will update if changes)
// Wait for final URL
const baseUrl = 'https://react-dashboard-by-nirmala-main.vercel.app';

function testPythonRoute() {
    const videoId = 'll4sfbrsdn4'; // a-ha
    const url = `${baseUrl}/api/transcript?videoId=${videoId}`;
    console.log("Testing Python Route: " + url);

    https.get(url, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log("BODY snippet:", data.substring(0, 200));
        });
    });
}

testPythonRoute();
