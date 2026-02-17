const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing");
        return;
    }
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // CAUTION: Logs sensitive data, but needed for debug. 
    // Actually, let's not log the full secret, just the host.
    const url = new URL(process.env.DATABASE_URL);
    console.log("Connecting to host:", url.hostname);

    try {
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT 1`;
        console.log("Connection successful:", result);
    } catch (error) {
        console.error("Connection failed:");
        console.dir(error, { depth: null });
    }
}

main();
