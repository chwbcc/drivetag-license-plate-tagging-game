import { initDatabase, getDatabase } from './database';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

console.log('[Add Super Admin] Loading environment variables...');
console.log('[Add Super Admin] TURSO_DB_URL:', process.env.TURSO_DB_URL ? 'Loaded' : 'Missing');
console.log('[Add Super Admin] TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'Loaded' : 'Missing');

const addSuperAdmin = async () => {
  try {
    console.log('[Add Super Admin] Starting...');
    
    await initDatabase();
    
    const db = getDatabase();
    
    const email = 'chwbcc@gmail.com';
    const password = 'SuperAdmin123!';
    const name = 'Jerry Witman';
    const licensePlate = 'ADMIN1';
    const state = 'CA';
    
    console.log(`[Add Super Admin] Creating super admin with email: ${email}`);
    
    const existingUser = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
      args: [email.toLowerCase()]
    });
    
    if (existingUser.rows.length > 0) {
      console.log('[Add Super Admin] User already exists. Updating to super_admin role...');
      
      await db.execute({
        sql: 'UPDATE users SET role = ? WHERE LOWER(email) = ?',
        args: ['super_admin', email.toLowerCase()]
      });
      
      console.log('[Add Super Admin] Successfully updated existing user to super_admin');
      console.log('Email:', email);
      console.log('Password: (unchanged)');
      return;
    }
    
    const passwordHash = password;
    
    const userId = `user_${Date.now()}`;
    
    const stats = JSON.stringify({
      pelletCount: 1000,
      positivePelletCount: 1000,
      badges: [],
      exp: 0,
      level: 1,
      name,
      photo: undefined,
      licensePlate,
      state,
    });
    
    await db.execute({
      sql: 'INSERT INTO users (id, email, username, passwordHash, createdAt, stats, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        userId,
        email,
        name,
        passwordHash,
        Date.now(),
        stats,
        'super_admin'
      ]
    });
    
    console.log('[Add Super Admin] Successfully created super admin!');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('License Plate:', licensePlate);
    console.log('State:', state);
    console.log('-----------------------------------');
    console.log('IMPORTANT: Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('[Add Super Admin] Error:', error);
    process.exit(1);
  }
};

addSuperAdmin();
