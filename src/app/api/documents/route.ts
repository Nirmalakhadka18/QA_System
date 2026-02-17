import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userDocs = await db
            .select({
                id: documents.id,
                name: documents.name,
                type: documents.type,
                createdAt: documents.createdAt,
            })
            .from(documents)
            .where(eq(documents.userId, (session.user as any).id))
            .orderBy(documents.createdAt);

        return NextResponse.json(userDocs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing document id" }, { status: 400 });
        }

        await db
            .delete(documents)
            .where(
                and(
                    eq(documents.id, id),
                    eq(documents.userId, (session.user as any).id)
                )
            );

        return NextResponse.json({ message: "Document deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
