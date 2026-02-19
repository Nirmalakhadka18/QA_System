import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { url, transcript, useMetadataOnly } = await req.json();

        if (!transcript && !useMetadataOnly) {
            return NextResponse.json({ error: "Transcript is required unless using metadata mode." }, { status: 400 });
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
            if (url) {
                const oembedUrl = `https://www.youtube.com/oembed?url=${url}&format=json`;
                const metadataRes = await fetch(oembedUrl);
                if (metadataRes.ok) {
                    const metadata = await metadataRes.json();
                    videoTitle = metadata.title || "Unknown Video";
                    channelName = metadata.author_name || "Unknown Channel";
                }
            }
        } catch (error) {
            console.warn("Failed to fetch video metadata:", error);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Switching to gemini-flash-latest (Verified working for this key)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = "";

        if (useMetadataOnly) {
            prompt = `
    You are an expert AI tutor.
    Task: Summarize the content of the video based on its TITLE and METADATA (since transcripts are unavailable).
    
    Video Context:
    - Title: ${videoTitle}
    - Channel: ${channelName}
    - URL: ${url || 'Not provided'}
    
    Please provide the response in the following Markdown format ONLY (do not add introductory text like "Here is the summary"):
    
    # [Video Title] 
    
    ## 1. Summary
    [Concise summary of the video content/song meaning]
    
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
    
    Disclaimer: This summary is based on metadata and cultural knowledge as a transcript was unavailable.
    `;
        } else {
            prompt = `
    You are an expert AI tutor.
    Task: Summarize the video and generate clean study notes based on the provided transcript.
    
    Video Context:
    - Title: ${videoTitle}
    - Channel: ${channelName}
    - URL: ${url || 'Not provided'}
    
    Transcript:
    "${transcript.slice(0, 25000)}" 

    Please provide the response in the following Markdown format ONLY:
    
    # [Video Title] 
    
    ## 1. Summary
    [Concise summary]
    
    ## 2. Detailed Study Notes
    ### Content Overview
    ### Key Concepts
    
    ## 3. Context & Analysis
    [Brief explanation]
    `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const finalTranscript = transcript || "Metadata-only summary generated.";

        return NextResponse.json({ summary: text, transcript: finalTranscript });

    } catch (error: any) {
        console.error("Manual Summary Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
