import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/db/schema";

// Removed top-level import to avoid bundling issues

// Re-forcing build to fix ESM import issue

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = "";
        let type = "";

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            try {
                // Using dynamic import for the internal lib to bypass buggy index
                // @ts-ignore
                const pdfParser = (await import("pdf-parse/lib/pdf-parse.js")).default;
                const data = await pdfParser(buffer);
                extractedText = data.text;
                type = "pdf";
            } catch (pdfErr: any) {
                console.error("PDF Parsing error:", pdfErr);
                return NextResponse.json({
                    error: `PDF Error: ${pdfErr.message}. ${pdfErr.stack ? pdfErr.stack.substring(0, 100) : ''}`,
                    details: pdfErr.message
                }, { status: 422 });
            }
        } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            extractedText = buffer.toString("utf-8");
            type = "txt";
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        const workspaceId = formData.get("workspaceId") as string;

        const [document] = await db.insert(documents).values({
            userId: (session.user as any).id,
            workspaceId: workspaceId || null,
            name: file.name,
            type: type,
            content: extractedText,
        }).returning();

        return NextResponse.json({
            message: "File uploaded and processed successfully",
            document: {
                id: document.id,
                name: document.name,
            }
        });

    } catch (error: any) {
        console.error("Upload error details:", error);
        return NextResponse.json({
            error: error.message || "Internal server error",
            details: error.stack,
            fullError: error
        }, { status: 500 });
    }
}
