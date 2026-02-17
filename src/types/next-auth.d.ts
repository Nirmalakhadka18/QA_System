import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            status: string;
            createdAt: Date | null;
        } & DefaultSession["user"];
    }

    interface User {
        role: string;
        status: string;
        createdAt: Date | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
        status: string;
        id: string;
        createdAt: Date | null;
    }
}
