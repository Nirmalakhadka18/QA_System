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
        const { documentId, question } = await req.json();

        if (!documentId || !question) {
            return NextResponse.json({ error: "Missing documentId or question" }, { status: 400 });
        }

        const doc = await db
            .select()
            .from(documents)
            .where(
                and(
                    eq(documents.id, documentId),
                    eq(documents.userId, (session.user as any).id)
                )
            )
            .limit(1);

        if (doc.length === 0) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const documentContent = doc[0].content;
        let answer = "";

        if (groq) {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that answers questions based strictly on the provided document content. If the answer is not in the document, say you don't know based on the provided text.",
                    },
                    {
                        role: "user",
                        content: `Document Content:\n${documentContent}\n\nQuestion: ${question}`,
                    },
                ],
                model: "llama-3.3-70b-versatile",
            });
            answer = chatCompletion.choices[0]?.message?.content || "";
        } else if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `You are a helpful assistant that answers questions based strictly on the provided document content. If the answer is not in the document, say you don't know based on the provided text.\n\nDocument Content:\n${documentContent}\n\nQuestion: ${question}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            answer = response.text();
        } else {
            throw new Error("No AI API keys configured (Groq or Gemini)");
        }

        return NextResponse.json({ answer: answer || "No answer generated." });

    } catch (error: any) {
        console.error("QA error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
