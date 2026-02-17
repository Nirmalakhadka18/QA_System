const { Client } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");
const { pgTable, text, timestamp, uuid } = require("drizzle-orm/pg-core");
const { eq } = require("drizzle-orm");
const bcrypt = require("bcrypt");
const dns = require("dns");
require("dotenv").config();
// Custom DNS resolution to bypass local DNS issues
const { URL } = require("url");

async function getClient() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL missing");

    const url = new URL(dbUrl);
    const hostname = url.hostname;

    try {
        console.log(`Resolving ${hostname} using Google DNS...`);
        dns.setServers(["8.8.8.8", "8.8.4.4"]);
        const addresses = await dns.promises.resolve4(hostname);
        const ip = addresses[0];
        console.log(`Resolved ${hostname} to ${ip}`);

        // Update URL to use IP
        url.hostname = ip;
        url.searchParams.delete("sslmode");

        const client = new Client({
            connectionString: url.toString(),
            ssl: {
                servername: hostname, // SNI requirement for Neon
                rejectUnauthorized: false,
            },
        });
        return client;
    } catch (error) {
        console.error("DNS Resolution failed:", error);
        throw error;
    }
}

let client;

// Helper to get db instance
async function getDb() {
    if (!client) client = await getClient();
    await client.connect();
    return drizzle(client);
}

// Define schema manually to match src/db/schema.ts
const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").default("user").notNull(),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

async function main() {
    try {
        console.log("Connecting to DB...");
        const db = await getDb();
        const existingAdmin = await db.select().from(users).where(eq(users.email, "test@test.com")).limit(1);

        if (existingAdmin.length > 0) {
            console.log("Admin user 'test@test.com' already exists.");
            return;
        }

        console.log("Creating admin user...");
        const hashedPassword = await bcrypt.hash("Test123@123", 10);

        await db.insert(users).values({
            id: "00000000-0000-0000-0000-000000000001",
            name: "Admin User",
            email: "test@test.com",
            password: hashedPassword,
            role: "admin",
            status: "approved",
            createdAt: new Date(),
        });

        console.log("Admin seeded successfully!");
    } catch (error) {
        console.error("Error seeding admin:", error);
    } finally {
        await client.end();
    }
}

main();
