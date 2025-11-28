import { getDatabase } from '../database';
import { User, AdminRole } from '@/types';

export const createUser = async (user: Omit<User, 'pelletCount' | 'positivePelletCount' | 'badges' | 'exp' | 'level'>): Promise<User> => {
  const db = getDatabase();
  
  const adminRole = user.adminRole || null;
  
  const newUser: User = {
    id: user.id,
    email: user.email,
    password: user.password,
    name: user.name,
    photo: user.photo,
    licensePlate: user.licensePlate,
    state: user.state,
    pelletCount: 10,
    positivePelletCount: 5,
    badges: [],
    exp: 0,
    level: 1,
    adminRole,
    createdAt: new Date().toISOString(),
  };
  
  db.users.set(user.id, newUser);
  
  console.log('[UserService] Created user:', newUser.email);
  return newUser;
};

export const getUserById = async (userId: string): Promise<User> => {
  const db = getDatabase();
  
  const user = db.users.get(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  
  const normalizedEmail = email.toLowerCase();
  
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      return user;
    }
  }
  
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  
  return Array.from(db.users.values()).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'badges'>>): Promise<User> => {
  const db = getDatabase();
  
  const user = db.users.get(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const updatedUser: User = {
    ...user,
    ...updates,
    id: user.id,
    email: user.email,
  };
  
  db.users.set(userId, updatedUser);
  
  console.log('[UserService] Updated user:', userId);
  return updatedUser;
};

export const addBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  const db = getDatabase();
  
  const user = db.users.get(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.badges) {
    user.badges = [];
  }
  
  if (!user.badges.includes(badgeId)) {
    user.badges.push(badgeId);
    
    db.badges.set(`${userId}-${badgeId}`, {
      id: `${userId}-${badgeId}`,
      userId,
      badgeId,
      earnedAt: Date.now(),
    });
    
    db.users.set(userId, user);
  }
  
  console.log('[UserService] Added badge to user:', userId, badgeId);
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = getDatabase();
  
  const user = db.users.get(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  user.adminRole = adminRole;
  db.users.set(userId, user);
  
  console.log('[UserService] Updated user admin role:', userId, adminRole);
};
