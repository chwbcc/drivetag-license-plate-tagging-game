import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('app.db');
    
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
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
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users(admin_role);
      
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        badge_id TEXT NOT NULL,
        earned_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, badge_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
      
      CREATE TABLE IF NOT EXISTS pellets (
        id TEXT PRIMARY KEY,
        target_license_plate TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        reason TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('negative', 'positive')),
        latitude REAL,
        longitude REAL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_pellets_target ON pellets(target_license_plate);
      CREATE INDEX IF NOT EXISTS idx_pellets_creator ON pellets(created_by);
      CREATE INDEX IF NOT EXISTS idx_pellets_type ON pellets(type);
      
      CREATE TABLE IF NOT EXISTS user_activity (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        action_data TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity(created_at);
      
      CREATE TABLE IF NOT EXISTS license_plate_spottings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        state_code TEXT NOT NULL,
        spotted_at INTEGER NOT NULL,
        count INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, state_code)
      );
      
      CREATE INDEX IF NOT EXISTS idx_spottings_user_id ON license_plate_spottings(user_id);
    `);
    
    console.log('[Database] Database initialized successfully');
    return db;
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  return await initDatabase();
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('[Database] Database closed');
  }
};
