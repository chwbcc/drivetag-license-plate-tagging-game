import { createClient, type Client } from '@libsql/client';

type DBUser = {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  photo: string | null;
  license_plate: string;
  state: string | null;
  pellet_count: number;
  positive_pellet_count: number;
  exp: number;
  level: number;
  admin_role: string | null;
  created_at: number;
  updated_at: number;
};

type DBBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: number;
};

type DBPellet = {
  id: string;
  target_license_plate: string;
  created_by: string;
  created_at: number;
  reason: string;
  type: 'negative' | 'positive';
  latitude: number | null;
  longitude: number | null;
};

type DBActivity = {
  id: string;
  user_id: string;
  action_type: string;
  action_data: string | null;
  created_at: number;
};

type DBSpotting = {
  id: string;
  user_id: string;
  state_code: string;
  spotted_at: number;
  count: number;
};

type InMemoryDB = {
  users: DBUser[];
  badges: DBBadge[];
  pellets: DBPellet[];
  user_activity: DBActivity[];
  license_plate_spottings: DBSpotting[];
};

let client: Client | null = null;
let isInitialized = false;

const getClient = (): Client => {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    console.log('[Database] Environment check:', {
      hasUrl: !!url,
      hasToken: !!authToken,
      urlPrefix: url ? url.substring(0, 20) : 'none'
    });

    if (!url) {
      console.error('[Database] TURSO_DATABASE_URL is not set');
      throw new Error('TURSO_DATABASE_URL is not set. Please configure Turso integration.');
    }

    console.log('[Database] Creating Turso client');
    client = createClient({
      url,
      authToken,
    });
  }
  return client;
};

export const initDatabase = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    console.log('[Database] Initializing Turso database');
    const db = getClient();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        name TEXT,
        photo TEXT,
        license_plate TEXT NOT NULL,
        state TEXT,
        pellet_count INTEGER DEFAULT 0,
        positive_pellet_count INTEGER DEFAULT 0,
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        admin_role TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        badge_id TEXT NOT NULL,
        earned_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pellets (
        id TEXT PRIMARY KEY,
        target_license_plate TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        reason TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('negative', 'positive')),
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        action_data TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS license_plate_spottings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        state_code TEXT NOT NULL,
        spotted_at INTEGER NOT NULL,
        count INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_pellets_target ON pellets(target_license_plate)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_pellets_created_by ON pellets(created_by)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id)
    `);

    isInitialized = true;
    console.log('[Database] Database initialized successfully');
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = (): Client => {
  return getClient();
};

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    console.log('[Database] Closing Turso connection');
    client = null;
  }
};

export type { DBUser, DBBadge, DBPellet, DBActivity, DBSpotting, InMemoryDB, Client };
