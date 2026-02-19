"use server";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUsers() {
    try {
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
        return { success: true, data: allUsers };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function updateUserStatus(userId: string, status: "approved" | "rejected") {
    try {
        await db.update(users)
            .set({ status: status })
            .where(eq(users.id, userId));

        revalidatePath("/dashboard/admin");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user status:", error);
        return { success: false, error: "Failed to update user status" };
    }
}
