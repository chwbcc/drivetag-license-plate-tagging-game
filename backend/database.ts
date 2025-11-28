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

const db: InMemoryDB = {
  users: [],
  badges: [],
  pellets: [],
  user_activity: [],
  license_plate_spottings: [],
};

let isInitialized = false;

export const initDatabase = async (): Promise<void> => {
  if (isInitialized) return;
  
  console.log('[Database] Initializing in-memory database');
  isInitialized = true;
  console.log('[Database] Database initialized successfully');
};

export const getDatabase = (): InMemoryDB => {
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  console.log('[Database] Closing database connection');
};

export type { DBUser, DBBadge, DBPellet, DBActivity, DBSpotting, InMemoryDB };
