import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = process.env.GROQ_API_KEY ? new Groq({
    apiKey: process.env.GROQ_API_KEY,
}) : null;

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { documentId, workspaceId, question, deepSearch } = await req.json();

        if ((!documentId && !workspaceId) || !question) {
            return NextResponse.json({ error: "Missing identifiers or question" }, { status: 400 });
        }

        let context = "";
        const userId = (session.user as any).id;

        if (workspaceId) {
            const docs = await db
                .select()
                .from(documents)
                .where(
                    and(
                        eq(documents.workspaceId, workspaceId),
                        eq(documents.userId, userId)
                    )
                );

            if (docs.length === 0) {
                return NextResponse.json({ error: "No documents found in workspace" }, { status: 404 });
            }

            docs.forEach(doc => {
                context += `\n--- SOURCE: ${doc.name} ---\n${doc.content}\n`;
            });
        } else {
            const doc = await db
                .select()
                .from(documents)
                .where(
                    and(
                        eq(documents.id, documentId),
                        eq(documents.userId, userId)
                    )
                )
                .limit(1);

            if (doc.length === 0) {
                return NextResponse.json({ error: "Document not found" }, { status: 404 });
            }
            context = doc[0].content || "";
        }

        // Deep Search (Firecrawl)
        if (deepSearch && process.env.FIRECRAWL_API_KEY) {
            try {
                const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/search", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`
                    },
                    body: JSON.stringify({
                        query: question,
                        limit: 3,
                        scrapeOptions: { formats: ["markdown"] }
                    })
                });

                if (firecrawlRes.ok) {
                    const searchData = await firecrawlRes.json();
                    if (searchData.success && searchData.data) {
                        searchData.data.forEach((result: any) => {
                            context += `\n--- SOURCE: [WEB] ${result.title || result.url} ---\n${result.markdown || result.description}\n`;
                        });
                    }
                }
            } catch (e) {
                console.error("Deep search failed", e);
            }
        }

        let answer = "";
        const systemPrompt = `You are a helpful AI assistant in a multi-document workspace. 
Answer the user's question based on the provided context. 
If the information is spread across multiple sources, synthesize them.
CRITICAL: You MUST cite your sources using tags like [Source: FileName] or [Web].
If the answer is not in the context, say you don't know based on the provided materials.`;

        if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nQuestion: ${question}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            answer = response.text();
        } else if (groq) {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
                ],
                model: "llama-3.3-70b-versatile",
            });
            answer = chatCompletion.choices[0]?.message?.content || "";
        } else {
            throw new Error("No AI API keys configured");
        }

        return NextResponse.json({ answer: answer || "No answer generated." });

    } catch (error: any) {
        console.error("QA error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
