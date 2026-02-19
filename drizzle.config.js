const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
const { defineConfig } = require("drizzle-kit");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

module.exports = defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        host: "54.86.249.90",
        user: "neondb_owner",
        password: process.env.DATABASE_URL.split(":")[2].split("@")[0], // Extract password from URL
        database: "neondb",
        ssl: {
            rejectUnauthorized: false,
            servername: "ep-red-unit-aiw0d3hl-pooler.c-4.us-east-1.aws.neon.tech",
        },
    },
});
