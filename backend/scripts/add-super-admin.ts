import { createClient } from '@libsql/client';
import { createHash } from 'crypto';

const SUPER_ADMIN_EMAIL = 'admin@driverrating.com';
const SUPER_ADMIN_PASSWORD = 'Admin123!';
const SUPER_ADMIN_LICENSE = 'ADMIN001';
const SUPER_ADMIN_NAME = 'Super Admin';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function addSuperAdmin() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables');
    console.log('Please set these in your .env file or environment');
    process.exit(1);
  }

  console.log('🔗 Connecting to Turso database...');
  const client = createClient({ url, authToken });

  try {
    console.log('🔍 Checking if super admin already exists...');
    const existingUser = await client.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      args: [SUPER_ADMIN_EMAIL]
    });

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Super admin user already exists!');
      console.log('📧 Email:', SUPER_ADMIN_EMAIL);
      console.log('🚗 License Plate:', SUPER_ADMIN_LICENSE);
      
      const user = existingUser.rows[0];
      console.log('👤 User ID:', user.id);
      console.log('🔑 Admin Role:', user.admin_role || 'None');
      
      if (user.admin_role === 'super_admin') {
        console.log('✅ User already has super_admin role');
      } else {
        console.log('🔄 Updating user to super_admin role...');
        await client.execute({
          sql: 'UPDATE users SET admin_role = ?, updated_at = ? WHERE id = ?',
          args: ['super_admin', Math.floor(Date.now() / 1000), user.id]
        });
        console.log('✅ User updated to super_admin role');
      }
      
      return;
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = hashPassword(SUPER_ADMIN_PASSWORD);

    console.log('➕ Creating super admin user...');
    const userId = `admin-${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);

    await client.execute({
      sql: `
        INSERT INTO users (
          id, email, password, name, photo, license_plate, state,
          admin_role, pellet_count, positive_pellet_count, exp, level,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        userId,
        SUPER_ADMIN_EMAIL,
        hashedPassword,
        SUPER_ADMIN_NAME,
        null,
        SUPER_ADMIN_LICENSE,
        null,
        'super_admin',
        0,
        0,
        0,
        1,
        now,
        now
      ]
    });

    console.log('✅ Super admin user created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:        ', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:     ', SUPER_ADMIN_PASSWORD);
    console.log('🚗 License Plate:', SUPER_ADMIN_LICENSE);
    console.log('👤 User ID:      ', userId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

addSuperAdmin().catch(console.error);
