import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Missing email or password" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (default role: user, status: pending)
        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: "user",
            status: "pending",
        });

        return NextResponse.json(
            { message: "User created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);

        // Log environment status for debugging (without exposing secrets)
        console.error("DB Config Status:", {
            hasUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV,
        });

        // Check for connection error
        const message = error instanceof Error && (error.message.includes("ENOTFOUND") || error.message.includes("connect") || error.message.includes("database"))
            ? "DB offline or unreachable. Check server logs."
            : "Registration failed. Database is unreachable.";

        return NextResponse.json(
            { message, details: error instanceof Error ? error.message : String(error) },
            { status: 503 }
        );
    }
}
