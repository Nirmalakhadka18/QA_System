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

        // Strategy 2: Call internal Python Serverless Function (api/transcript.py)
        if (!transcriptText) {
            try {
                console.log(`[Transcript] Attempting Python fallback for ${videoId}...`);

                // Construct absolute URL for internal call
                // Vercel Headers usually contain the host
                const protocol = req.headers.get("x-forwarded-proto") || "https";
                const host = req.headers.get("host");
                const baseUrl = `${protocol}://${host}`;
                const pythonApiUrl = `${baseUrl}/api/transcript?videoId=${videoId}`;

                console.log(`[Transcript] Fetching from: ${pythonApiUrl}`);
                const pyResponse = await fetch(pythonApiUrl);
                const pyData = await pyResponse.json();

                if (pyResponse.ok && pyData.transcript) {
                    transcriptText = pyData.transcript;
                    console.log(`[Transcript] Python fallback success. Length: ${transcriptText.length}`);
                } else {
                    throw new Error(pyData.error || "Python endpoint returned error");
                }

            } catch (fallbackError: any) {
                console.error("[Transcript] Python fallback failed:", fallbackError.message);

                // Strategy 3: Last resort youtube-transcript (Node)
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
