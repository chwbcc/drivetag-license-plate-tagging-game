import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

let db: SupabaseClient | null = null;
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
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = 'Database configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or EXPO_PUBLIC_SUPABASE_KEY) environment variables';
      console.error('[Database]', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('[Database] Initializing Supabase client...');
      console.log('[Database] URL:', supabaseUrl);
      
      db = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      
      console.log('[Database] Supabase client initialized successfully');
      console.log('[Database] Make sure to create the following tables in your Supabase dashboard:');
      console.log('[Database] - users (id, email, username, created_at, stats, role, license_plate, state, experience, level)');
      console.log('[Database] - pellets (id, targetLicensePlate, targetUserId, createdBy, createdAt, reason, type, latitude, longitude)');
      console.log('[Database] - badges (id, userId, badgeId, earnedAt)');
      console.log('[Database] - activities (id, userId, actionType, actionData, createdAt)');
      
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
