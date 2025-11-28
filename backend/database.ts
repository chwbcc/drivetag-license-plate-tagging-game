import { createClient, type Client } from '@libsql/client';
import { User } from '@/types';

interface Badge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: number;
}

interface Pellet {
  id: string;
  targetLicensePlate: string;
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

export const initDatabase = async () => {
  const dbUrl = process.env.TURSO_DB_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.error('[Database] TURSO_DB_URL and TURSO_AUTH_TOKEN must be set in environment variables');
    throw new Error('Database configuration missing');
  }

  try {
    db = createClient({
      url: dbUrl,
      authToken: authToken,
    });

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        stats TEXT NOT NULL,
        role TEXT DEFAULT 'user'
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
        createdBy TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        reason TEXT NOT NULL,
        type TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);

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
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  }
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
