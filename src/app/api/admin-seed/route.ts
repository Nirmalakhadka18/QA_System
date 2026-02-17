import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const existingAdmin = await db
            .select()
            .from(users)
            .where(eq(users.email, "test@test.com"))
            .limit(1);

        if (existingAdmin.length > 0) {
            return NextResponse.json({ message: "Admin already exists. You can login now." }, { status: 200 });
        }

        const hashedPassword = await bcrypt.hash("Test123@123", 10);

        await db.insert(users).values({
            name: "Admin User",
            email: "test@test.com",
            password: hashedPassword,
            role: "admin",
            status: "approved",
            createdAt: new Date(),
        });

        return NextResponse.json({ message: "Admin seeded successfully! You can now login." }, { status: 201 });
    } catch (error) {
        console.error("Error seeding admin:", error);
        return NextResponse.json({ error: "Failed to seed admin", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
