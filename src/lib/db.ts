import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Use the HTTP driver for robust serverless connections (avoids TCP/SSL issues)
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Export Pool as undefined/mock if needed, but grep showed no usage. 
// If something breaks, we can add a compatibility layer.
