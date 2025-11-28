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

const users: Map<string, User> = new Map();
const badges: Map<string, Badge> = new Map();
const pellets: Map<string, Pellet> = new Map();
const activities: Map<string, Activity> = new Map();

export const initDatabase = async () => {
  console.log('[Database] In-memory database initialized');
};

export const getDatabase = () => {
  return {
    users,
    badges,
    pellets,
    activities,
  };
};

export const closeDatabase = async (): Promise<void> => {
  console.log('[Database] Database closed');
};

export { users, badges, pellets, activities };
export type { Badge, Pellet, Activity };
