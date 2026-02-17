import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function GET() {
    try {
        const testEmail = "test@test.com"; // default admin email

        // 1. Check DB Connection & User Existence
        const user = await db
            .select()
            .from(users)
            .where(eq(users.email, testEmail))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({
                status: "error",
                message: "User not found in database",
                databaseUrlHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || "Unknown"
            });
        }

        const foundUser = user[0];

        // 2. Check Password Match
        const isPasswordValid = await bcrypt.compare("Test123@123", foundUser.password);

        return NextResponse.json({
            status: "success",
            userFound: true,
            userId: foundUser.id,
            email: foundUser.email,
            role: foundUser.role,
            isPasswordValid: isPasswordValid, // Crucial check
            databaseUrlHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || "Unknown",
            passwordHashStart: foundUser.password.substring(0, 10) + "..."
        });

    } catch (error: any) {
        return NextResponse.json({
            status: "critical_error",
            error: error.message,
            stack: error.stack
        });
    }
}
