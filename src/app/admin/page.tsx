import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    type User = {
        id: string;
        name: string | null;
        email: string;
        status: string;
        role: string;
        createdAt: Date | null;
    };

    let pendingUsers: User[] = [];
    let approvedUsers: User[] = [];

    try {
        // Fetch pending users
        pendingUsers = await db
            .select()
            .from(users)
            .where(eq(users.status, "pending")) as User[];

        // Fetch approved users
        approvedUsers = await db
            .select()
            .from(users)
            .where(eq(users.status, "approved")) as User[];
    } catch (error) {
        console.error("Failed to fetch users:", error);
        // Fallback to show current admin if DB is unreachable
        if (session.user) {
            approvedUsers = [{
                id: session.user.id || "admin-fallback",
                name: session.user.name || "Admin User",
                email: session.user.email || "test@test.com",
                role: session.user.role || "admin",
                status: session.user.status || "approved",
                createdAt: new Date(), // Mock date
            }];
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <AdminDashboard initialPendingUsers={pendingUsers} approvedUsers={approvedUsers} />
        </div>
    );
}
