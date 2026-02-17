require("dotenv").config();
const { defineConfig } = require("drizzle-kit");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

module.exports = defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
