import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const dbUrl = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");
const url = new URL(dbUrl || "postgres://localhost/db");
const originalHostname = url.hostname;

if (originalHostname.includes("neon.tech")) {
    url.hostname = "44.211.114.173"; // Bypass DNS
}

url.searchParams.delete("sslmode");
url.searchParams.delete("channel_binding");

// Singleton pattern for Next.js dev mode
const globalForDb = global as unknown as {
    pool: Pool | undefined,
    drizzle: any | undefined
};

if (!globalForDb.pool) {
    console.log("[DB] Creating new pool for", originalHostname);
    globalForDb.pool = new Pool({
        connectionString: url.toString(),
        ssl: {
            servername: originalHostname,
            rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        max: 10,
    });

    globalForDb.pool.on('error', (err) => {
        console.error('[DB] Unexpected pool error', err);
    });
}

if (!globalForDb.drizzle) {
    globalForDb.drizzle = drizzle(globalForDb.pool);
}

export const db = globalForDb.drizzle;
export { Pool };
