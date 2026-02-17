require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function listUsers() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(databaseUrl);

    try {
        const users = await sql`SELECT id, name, email, role, status FROM users`;
        const output = JSON.stringify(users, null, 2);
        fs.writeFileSync('users.json', output);
        console.log('Users saved to users.json');
    } catch (error) {
        console.error('Error listing users:', error);
    }
}

listUsers();
