const { Innertube, UniversalCache } = require('youtubei.js');

async function testDefault() {
    const videoId = 'jNQXAC9IVRw'; // Me at the zoo (Public)
    console.log(`Testing youtubei.js DEFAULT for ${videoId}...`);
    try {
        const youtube = await Innertube.create({ generate_session_locally: false }); // Explicitly disable local session generation if that was the issue? 
        // Or just Innertube.create();

        const info = await youtube.getInfo(videoId);
        const transcriptData = await info.getTranscript();

        if (!transcriptData?.transcript) {
            console.log("No transcript data found.");
        } else {
            console.log("Success!");
            // Access logic depends on version, let's dump structure keys
            console.log("Keys:", Object.keys(transcriptData.transcript));
            try {
                const text = transcriptData.transcript.content.body.initial_segments.map(s => s.snippet.text).join(' ');
                console.log("Snippet:", text.substring(0, 100));
            } catch (e) {
                console.log("Could not parse structure:", e.message);
            }
        }
    } catch (e) {
        console.error("Failed:", e);
    }
}

testDefault();
