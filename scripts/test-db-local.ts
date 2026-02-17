
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

async function test() {
    console.log("-----------------------------------------");
    console.log("   LOCAL DATABASE CONNECTION TEST");
    console.log("-----------------------------------------");

    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
        console.error("❌ DATABASE_URL is missing in local .env");
        process.exit(1);
    }

    console.log("Original URL Length:", rawUrl.length);
    console.log("Original URL Preview:", `${rawUrl.substring(0, 15)}...${rawUrl.substring(rawUrl.length - 10)}`);

    // 1. Sanitize
    const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, "");
    console.log("Sanitized URL Preview:", `${cleanUrl.substring(0, 15)}...${cleanUrl.substring(cleanUrl.length - 10)}`);

    if (cleanUrl === rawUrl) {
        console.log("✅ No quotes detected/removed.");
    } else {
        console.log("⚠️  Quotes were removed from URL.");
    }

    try {
        // 2. Test Raw Neon Driver
        console.log("\n[1/3] Testing Raw Neon Driver (Select 1)...");
        const sqlRaw = neon(cleanUrl);
        // Correct syntax: tagged template literal
        const resultRaw = await sqlRaw`SELECT 1 as val`;
        console.log("✅ Raw Connection Success:", resultRaw);

        // 3. Test Raw Neon Driver (Table Check)
        console.log("\n[2/3] Testing Raw Neon Driver (Select Users Count)...");
        const resultUsersRaw = await sqlRaw`SELECT count(*) FROM users`;
        console.log("✅ Raw Query Success:", resultUsersRaw);

        // 4. Test Drizzle ORM
        console.log("\n[3/3] Testing Drizzle ORM...");
        const db = drizzle(sqlRaw);

        // Drizzle uses SQL template tag internally or helper function
        // We can use db.execute(sql`...`) if we import sql helper from drizzle-orm
        // But for quick check, let's try a query that drizzle builds:
        // Or import sql helper:
        const { sql } = require("drizzle-orm");

        const resultDrizzle = await db.execute(sql`SELECT count(*) FROM users LIMIT 1`);
        console.log("✅ Drizzle Query Success:", resultDrizzle);

        console.log("\n-----------------------------------------");
        console.log("🎉 ALL LOCAL TESTS PASSED");
        console.log("-----------------------------------------");

    } catch (e: any) {
        console.error("\n❌ TEST FAILED");
        console.error("Error Name:", e.name);
        console.error("Error Message:", e.message);
        if (e.cause) console.error("Error Cause:", e.cause);
        process.exit(1);
    }
}

test();
