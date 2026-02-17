const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

console.log("Connecting to:", process.env.DATABASE_URL.replace(/:[^:]+@/, ":***@"));

const sql = neon(process.env.DATABASE_URL);

async function check() {
    try {
        const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log("Tables found:", result.map(r => r.table_name));

        // Check if 'users' table exists specifically
        if (result.some(r => r.table_name === 'users')) {
            console.log("Users table exists.");
        } else {
            console.error("Users table MISSING!");
        }
    } catch (err) {
        console.error("Query failed:", err);
    }
}

check();
