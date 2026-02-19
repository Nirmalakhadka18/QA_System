import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        console.log(`[Registration] Attempting to register ${email}`);

        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

        if (existingUser.length > 0) {
            console.log(`[Registration] User ${email} already exists`);
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        // Default role: 'user', Default status: 'pending' (from schema)
        await db.insert(users).values({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        console.log(`[Registration] Successfully registered ${email}`);
        return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

    } catch (error: any) {
        console.error("[Registration Error]:", error);
        return NextResponse.json({
            message: "An error occurred during registration",
            details: error.message
        }, { status: 500 });
    }
}
