const { Client } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const dns = require("dns");
const { URL } = require("url");
require("dotenv").config();

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

async function main() {
    let client;
    try {
        console.log("Connecting to DB for migration...");
        client = await getClient();
        await client.connect();
        const db = drizzle(client);

        console.log("Running migrations...");
        await migrate(db, { migrationsFolder: "./drizzle" });

        console.log("Migrations applied successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        if (client) await client.end();
    }
}

main();
