import { createClient, type Client } from '@libsql/client';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

interface Badge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: number;
}

interface Pellet {
  id: string;
  targetLicensePlate: string;
  targetUserId?: string;
  createdBy: string;
  createdAt: number;
  reason: string;
  type: 'negative' | 'positive';
  latitude?: number;
  longitude?: number;
}

interface Activity {
  id: string;
  userId: string;
  actionType: string;
  actionData: any;
  createdAt: number;
}

let db: Client | null = null;
let initPromise: Promise<void> | null = null;

export const initDatabase = async () => {
  if (db) {
    console.log('[Database] Database already initialized, skipping');
    return;
  }

  if (initPromise) {
    console.log('[Database] Database initialization in progress, waiting...');
    return initPromise;
  }

  initPromise = (async () => {
    const dbUrl = process.env.TURSO_DB_URL || process.env.EXPO_PUBLIC_TURSO_DB_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN;

    console.log('[Database] Initializing database...');
    console.log('[Database] TURSO_DB_URL:', dbUrl ? 'SET' : 'NOT SET');
    console.log('[Database] TURSO_AUTH_TOKEN:', authToken ? 'SET' : 'NOT SET');

    if (!dbUrl || !authToken) {
      const errorMsg = 'Database configuration missing. Please check your .env file has TURSO_DB_URL and TURSO_AUTH_TOKEN';
      console.error('[Database]', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      db = createClient({
        url: dbUrl,
        authToken: authToken,
      });
      
      console.log('[Database] Client created successfully');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        stats TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        licensePlate TEXT,
        state TEXT,
        resetToken TEXT,
        resetTokenExpiry INTEGER
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        badgeId TEXT NOT NULL,
        earnedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pellets (
        id TEXT PRIMARY KEY,
        targetLicensePlate TEXT NOT NULL,
        targetUserId TEXT,
        createdBy TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        reason TEXT NOT NULL,
        type TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (createdBy) REFERENCES users(id),
        FOREIGN KEY (targetUserId) REFERENCES users(id)
      )
    `);
    
    console.log('[Database] Running migrations...');
    try {
      const result = await db.execute('PRAGMA table_info(pellets)');
      const columns = result.rows.map(row => row.name as string);
      
      if (!columns.includes('targetUserId')) {
        console.log('[Database] Adding targetUserId column to pellets table...');
        await db.execute('ALTER TABLE pellets ADD COLUMN targetUserId TEXT');
        console.log('[Database] targetUserId column added successfully');
      }
    } catch (migrationError) {
      console.log('[Database] Migration check/execution completed or not needed:', migrationError);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        actionType TEXT NOT NULL,
        actionData TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

      console.log('[Database] Turso database initialized successfully');
      console.log('[Database] Tables created/verified successfully');
    } catch (error) {
      console.error('[Database] Error initializing database:', error);
      db = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] Database closed');
  }
};

export type { Badge, Pellet, Activity };
