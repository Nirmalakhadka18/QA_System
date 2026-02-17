import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("Authorize attempt:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Bypass check - COMMENTED OUT TO PREVENT FOREIGN KEY ERRORS IN PRODUCTION
                // if (credentials.email === "test@test.com" && credentials.password === "Test123@123") {
                //     console.log("Admin bypass triggered");
                //     return {
                //         id: "00000000-0000-0000-0000-000000000001",
                //         name: "Admin User",
                //         email: "test@test.com",
                //         role: "admin",
                //         status: "approved",
                //         createdAt: new Date(),
                //     };
                // }

                // Bypass check for standard test user - COMMENTED OUT
                // if (credentials.email === "user@test.com" && credentials.password === "Test123@123") {
                //     return {
                //         id: "00000000-0000-0000-0000-000000000002",
                //         name: "Test User",
                //         email: "user@test.com",
                //         role: "user",
                //         status: "approved",
                //         createdAt: new Date(),
                //     };
                // }

                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, credentials.email))
                    .limit(1);

                if (user.length === 0) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user[0].password
                );

                if (!isValidPassword) {
                    return null;
                }

                // Return user object, augment with role and status
                return {
                    id: user[0].id,
                    name: user[0].name,
                    email: user[0].email,
                    role: user[0].role,
                    status: user[0].status,
                    createdAt: user[0].createdAt,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.status = user.status;
                token.id = user.id;
                token.createdAt = user.createdAt;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.status = token.status as string;
                session.user.id = token.id as string;
                session.user.createdAt = token.createdAt as Date;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};
