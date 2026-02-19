import { NextRequest, NextResponse } from "next/server";
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

        // Strategy 1: Multi-Client Innertube (Resilient)
        if (!transcriptText) {
            const clients: any[] = ["ANDROID", "MWEB", "YTMUSIC", "WEB"];
            for (const clientType of clients) {
                try {
                    console.log(`[Transcript] Strategy 1: Innertube (${clientType}) for ${videoId}`);
                    const { Innertube, UniversalCache } = await import('youtubei.js');
                    const youtube = await Innertube.create({
                        client_type: clientType,
                        generate_session_locally: true
                    });

                    const info = await youtube.getInfo(videoId);

                    // Try direct getTranscript()
                    try {
                        const transcriptData = await info.getTranscript();
                        if (transcriptData?.transcript?.content?.body?.initial_segments) {
                            transcriptText = transcriptData.transcript.content.body.initial_segments
                                .map((seg: any) => seg.snippet.text)
                                .join(" ");
                            console.log(`[Transcript] Success with client ${clientType}. Length: ${transcriptText.length}`);
                            break;
                        }
                    } catch (innerError) {
                        console.warn(`[Transcript] getTranscript failed for ${clientType}, trying manual track extraction`);
                    }

                    // Try manual extraction from player_response (captions block)
                    const tracks = (info as any).player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                    if (tracks && tracks.length > 0) {
                        const enTrack = tracks.find((t: any) => t.languageCode === 'en' || t.vssId?.includes('en')) || tracks[0];
                        const trackUrl = enTrack.baseUrl + (enTrack.baseUrl.includes('?') ? '&' : '?') + 'fmt=srv1';
                        const transcriptRes = await fetch(trackUrl);
                        const xml = await transcriptRes.text();
                        const segments = xml.match(/<text\s+[^>]*>([^<]*)<\/text>/g) || [];
                        transcriptText = segments
                            .map(s => s.replace(/<text\s+[^>]*>/, '').replace('</text>', ''))
                            .map(s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
                            .join(' ');

                        if (transcriptText.length > 100) {
                            console.log(`[Transcript] Manual Success with client ${clientType}. Length: ${transcriptText.length}`);
                            break;
                        }
                    }
                } catch (e: any) {
                    console.warn(`[Transcript] Client ${clientType} failed: ${e.message}`);
                }
            }
        }

        // Strategy 2: Python Serverless Fallback (More Resilient)
        if (!transcriptText) {
            try {
                console.log(`[Transcript] Strategy 2: Python Serverless Fallback for ${videoId}`);
                // Call the local python function via the internal Vercel URL or the public one
                // Since this is during execution on Vercel, we can try to fetch the absolute URL
                const protocol = req.headers.get("x-forwarded-proto") || "http";
                const host = req.headers.get("host") || "localhost:3000";
                const baseUrl = `${protocol}://${host}`;

                const pyRes = await fetch(`${baseUrl}/api/python/transcript?videoId=${videoId}`);
                if (pyRes.ok) {
                    const pyData = await pyRes.json();
                    if (pyData.transcript) {
                        transcriptText = pyData.transcript;
                        console.log(`[Transcript] Strategy 2 Success. Length: ${transcriptText.length}`);
                    }
                } else {
                    const errData = await pyRes.json();
                    console.warn(`[Transcript] Strategy 2 Fail: ${errData.error}`);
                }
            } catch (e: any) {
                console.warn(`[Transcript] Strategy 2 Exception: ${e.message}`);
            }
        }

        // Strategy 3: youtube-transcript library (Quick Catch-all)
        if (!transcriptText) {
            try {
                console.log(`[Transcript] Strategy 3: youtube-transcript for ${videoId}`);
                const { YoutubeTranscript } = await import('youtube-transcript');
                const transcript = await YoutubeTranscript.fetchTranscript(videoId);
                transcriptText = transcript.map(t => t.text).join(" ");
                if (transcriptText.length > 100) {
                    console.log(`[Transcript] Strategy 3 success. Length: ${transcriptText.length}`);
                }
            } catch (e: any) {
                console.warn(`[Transcript] Strategy 3 failed: ${e.message}`);
            }
        }

        // Strategy 3: Manual Regex Scraper (Last Resort)
        if (!transcriptText) {
            try {
                console.log(`[Transcript] Strategy 3: Manual Regex Scraper for ${videoId}`);
                const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language': 'en-US,en;q=0.0',
                        'Referer': 'https://www.google.com/',
                        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+417;'
                    }
                });
                const html = await response.text();
                const jsonMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (jsonMatch) {
                    const playerResponse = JSON.parse(jsonMatch[1]);
                    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                    if (tracks && tracks.length > 0) {
                        const enTrack = tracks.find((t: any) => t.languageCode === 'en' || t.vssId?.includes('en')) || tracks[0];
                        const trackUrl = enTrack.baseUrl + (enTrack.baseUrl.includes('?') ? '&' : '?') + 'fmt=srv1';
                        const transcriptRes = await fetch(trackUrl);
                        const xml = await transcriptRes.text();
                        const segments = xml.match(/<text\s+[^>]*>([^<]*)<\/text>/g) || [];
                        transcriptText = segments
                            .map(s => s.replace(/<text\s+[^>]*>/, '').replace('</text>', ''))
                            .map(s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
                            .join(' ');

                        if (transcriptText.length > 100) {
                            console.log(`[Transcript] Strategy 3 success. Length: ${transcriptText.length}`);
                        }
                    }
                }
            } catch (e: any) {
                console.warn(`[Transcript] Strategy 3 failed: ${e.message}`);
            }
        }

        if (!transcriptText || transcriptText.length < 50) {
            return NextResponse.json({
                error: "COULD_NOT_FETCH_TRANSCRIPT",
                message: "We couldn't fetch the transcript automatically. YouTube might be blocking the request. You can try pasting the transcript manually below."
            }, { status: 404 });
        }

        // Initialize Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server Error: GEMINI_API_KEY is not set." }, { status: 500 });
        }

        // Try to fetch video metadata for context
        let videoTitle = "Unknown Video";
        let channelName = "Unknown Channel";
        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${url}&format=json`;
            const metadataRes = await fetch(oembedUrl);
            if (metadataRes.ok) {
                const metadata = await metadataRes.json();
                videoTitle = metadata.title || "Unknown Video";
                channelName = metadata.author_name || "Unknown Channel";
            }
        } catch (error) {
            console.warn("Failed to fetch video metadata:", error);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Switching to gemini-flash-latest (Verified working for this key)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
    You are an expert AI tutor.
    Task: Summarize the video and generate clean study notes based on the provided transcript.
    
    Video Context:
    - Title: ${videoTitle}
    - Channel: ${channelName}
    - URL: ${url}
    
    Transcript:
    "${transcriptText.slice(0, 25000)}" 

    Please provide the response in the following Markdown format ONLY (do not add introductory text like "Here is the summary"):
    
    # [Video Title] 
    
    ## 1. Summary
    [Concise summary of the video content]
    
    ## 2. Detailed Study Notes
    
    ### Content Overview
    - [Bullet point 1]
    - [Bullet point 2]
    - ...
    
    ### Key Concepts
    - [Concept 1]
    - [Concept 2]
    
    ## 3. Context & Analysis
    [Brief explanation of the context]
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ summary: text, transcript: transcriptText });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
