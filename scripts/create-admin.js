require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = neon(databaseUrl);
    const email = 'test@test.com';
    const password = 'Test123@123';
    const name = 'Admin User';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if user exists
        const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (existingUsers.length > 0) {
            console.log('User exists. Updating to admin role and new password...');
            await sql`
        UPDATE users 
        SET role = 'admin', status = 'approved', password = ${hashedPassword}, name = ${name}
        WHERE email = ${email}
      `;
            console.log('✅ Admin user updated successfully.');
        } else {
            console.log('User does not exist. Creating new admin user...');
            await sql`
        INSERT INTO users (name, email, password, role, status)
        VALUES (${name}, ${email}, ${hashedPassword}, 'admin', 'approved')
      `;
            console.log('✅ Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

createAdmin();
