import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Neon
        // Optionally add servername if needed for certain Neon regions
        servername: process.env.DATABASE_URL?.includes("neon.tech")
            ? process.env.DATABASE_URL.split("@")[1].split("/")[0].split(":")[0]
            : undefined,
    },
});

export const db = drizzle(pool);

// Export Pool as undefined/mock if needed, but grep showed no usage. 
// If something breaks, we can add a compatibility layer.
