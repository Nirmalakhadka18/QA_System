import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Force dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Extract Video ID
        const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        let transcriptText = "";

        // Strategy 1: Try Innertube (youtubei.js)
        try {
            console.log(`[Transcript] Attempting Innertube for ${videoId}...`);
            const { Innertube, UniversalCache } = await import('youtubei.js');
            const youtube = await Innertube.create({
                cache: new UniversalCache(false),
                generate_session_locally: true
            });

            const info = await youtube.getInfo(videoId);
            const transcriptData = await info.getTranscript();

            if (transcriptData?.transcript?.content?.body?.initial_segments) {
                transcriptText = transcriptData.transcript.content.body.initial_segments
                    .map((seg: any) => seg.snippet.text)
                    .join(" ");
                console.log(`[Transcript] Innertube success. Length: ${transcriptText.length}`);
            }
        } catch (innertubeError: any) {
            console.warn("[Transcript] Innertube failed:", innertubeError.message);
        }

        // Strategy 2: Call internal Python Serverless Function (api/index.py) - Vercel Production
        if (!transcriptText) {
            try {
                console.log(`[Transcript] Attempting Python Serverless Function for ${videoId}...`);

                const protocol = req.headers.get("x-forwarded-proto") || "https";
                const host = req.headers.get("host"); // includes port locally
                const baseUrl = `${protocol}://${host}`;
                // Map to api/index.py via rewrite or direct call
                const pythonApiUrl = `${baseUrl}/api/python/transcript?videoId=${videoId}`;

                console.log(`[Transcript] Fetching from: ${pythonApiUrl}`);
                const pyResponse = await fetch(pythonApiUrl);
                const pyData = await pyResponse.json();

                if (pyResponse.ok && pyData.transcript) {
                    transcriptText = pyData.transcript;
                    console.log(`[Transcript] Python Function success. Length: ${transcriptText.length}`);
                }
            } catch (serverlessError: any) {
                console.warn("[Transcript] Python Function failed:", serverlessError.message);
            }
        }

        // Strategy 3: Local Python Script Spawn (Development environment support)
        if (!transcriptText) {
            try {
                console.log(`[Transcript] Attempting Local Python Script for ${videoId}...`);
                const { spawn } = require('child_process');
                const path = require('path');

                // Use absolute path for reliability
                const scriptPath = path.join(process.cwd(), 'src/scripts/get_transcript.py');

                const pythonProcess = spawn('python', [scriptPath, videoId]);

                let scriptOutput = "";
                let scriptError = "";

                for await (const chunk of pythonProcess.stdout) {
                    scriptOutput += chunk.toString();
                }

                for await (const chunk of pythonProcess.stderr) {
                    scriptError += chunk.toString();
                }

                if (scriptError) console.warn("Local Python stderr:", scriptError);

                try {
                    const result = JSON.parse(scriptOutput);
                    if (result.transcript) {
                        transcriptText = result.transcript;
                        console.log(`[Transcript] Local Script success. Length: ${transcriptText.length}`);
                    }
                } catch (e) {
                    // Ignore parsing errors, move to next strategy
                }

            } catch (spawnError: any) {
                console.warn("[Transcript] Local Script failed:", spawnError.message);
            }
        }

        // Strategy 4: Last resort youtube-transcript (Node)
        if (!transcriptText) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(videoId);
                transcriptText = transcript.map(t => t.text).join(" ");
                console.log(`[Transcript] Node fallback success.`);
            } catch (nodeError: any) {
                console.error("[Transcript] All methods failed.");

                const isNoCaptions = nodeError.message?.includes("Transcripts are disabled") || nodeError.message?.includes("No transcript found");
                const errorMessage = isNoCaptions
                    ? "This video does not have captions/transcripts available. Please try a different video."
                    : "Could not fetch transcript. The video might be restricted.";

                return NextResponse.json({ error: errorMessage }, { status: 404 });
            }
        }

        if (!transcriptText || transcriptText.length < 50) {
            return NextResponse.json({ error: "Could not fetch transcript. The video might be restricted, private, or lack captions." }, { status: 404 });
        }

        // Initialize Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server Error: GEMINI_API_KEY is not set." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
    You are an expert AI tutor.
    Here is the transcript of a YouTube video:
    "${transcriptText.slice(0, 25000)}" 
    (Note: Transcript might be truncated if too long)

    Please provide:
    1. A concise **Summary** of the video content.
    2. Detailed **Study Notes** with bullet points, capturing key concepts and definitions.
    
    Format the output in Markdown.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ summary: text, transcript: transcriptText });

    } catch (error: any) {
        console.error("API Error:", error);

        if (error.status === 429 || error.message?.includes("429")) {
            return NextResponse.json({ error: "AI Limit Reached: Please wait a moment and try again." }, { status: 429 });
        }

        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
