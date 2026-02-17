require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function promotenirmala() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(databaseUrl);
    const email = 'khadkanirmala757@gmail.com';

    try {
        await sql`
        UPDATE users 
        SET role = 'admin', status = 'approved'
        WHERE email = ${email}
    `;
        console.log(`✅ User ${email} has been promoted to Admin and Approved.`);
    } catch (error) {
        console.error('Error promoting user:', error);
    }
}

promotenirmala();
