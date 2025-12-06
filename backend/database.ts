

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

let db: any = null;
let initPromise: Promise<void> | null = null;

export const initDatabase = async () => {
  if (db) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = 'Database configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables';
      console.error('[Database]', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('[Database] Supabase connection ready to be implemented');
      console.log('[Database] TODO: Install @supabase/supabase-js and initialize client');
      console.log('[Database] TODO: Set up database tables in Supabase dashboard');
      
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
    db = null;
  }
};

export type { Badge, Pellet, Activity };
