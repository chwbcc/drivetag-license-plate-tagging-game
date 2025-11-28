import { getDatabase, type DBUser } from '../database';
import { User, AdminRole } from '@/types';

export const createUser = async (user: Omit<User, 'pelletCount' | 'positivePelletCount' | 'badges' | 'exp' | 'level'>): Promise<User> => {
  const db = getDatabase();
  
  const adminRole = user.adminRole || null;
  
  console.log('[UserService] Creating user:', { id: user.id, email: user.email, adminRole });
  
  const now = Math.floor(Date.now() / 1000);
  
  const dbUser: DBUser = {
    id: user.id,
    email: user.email,
    password: user.password || null,
    name: user.name || null,
    photo: user.photo || null,
    license_plate: user.licensePlate,
    state: user.state || null,
    admin_role: adminRole,
    pellet_count: 0,
    positive_pellet_count: 0,
    exp: 0,
    level: 1,
    created_at: now,
    updated_at: now,
  };
  
  db.users.push(dbUser);
  
  console.log('[UserService] User created successfully');
  
  return getUserById(user.id);
};

export const getUserById = async (userId: string): Promise<User> => {
  const db = getDatabase();
  
  const userRow = db.users.find(u => u.id === userId);
  
  if (!userRow) {
    throw new Error('User not found');
  }
  
  const badges = db.badges
    .filter(b => b.user_id === userId)
    .map(b => b.badge_id);
  
  return {
    id: userRow.id,
    email: userRow.email,
    password: userRow.password || undefined,
    name: userRow.name || undefined,
    photo: userRow.photo || undefined,
    licensePlate: userRow.license_plate,
    state: userRow.state || undefined,
    pelletCount: userRow.pellet_count,
    positivePelletCount: userRow.positive_pellet_count,
    badges,
    exp: userRow.exp,
    level: userRow.level,
    adminRole: userRow.admin_role as AdminRole,
    createdAt: new Date(userRow.created_at * 1000).toISOString(),
  };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  
  const userRow = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!userRow) {
    return null;
  }
  
  const badges = db.badges
    .filter(b => b.user_id === userRow.id)
    .map(b => b.badge_id);
  
  return {
    id: userRow.id,
    email: userRow.email,
    password: userRow.password || undefined,
    name: userRow.name || undefined,
    photo: userRow.photo || undefined,
    licensePlate: userRow.license_plate,
    state: userRow.state || undefined,
    pelletCount: userRow.pellet_count,
    positivePelletCount: userRow.positive_pellet_count,
    badges,
    exp: userRow.exp,
    level: userRow.level,
    adminRole: userRow.admin_role as AdminRole,
    createdAt: new Date(userRow.created_at * 1000).toISOString(),
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  
  console.log(`[UserService] Found ${db.users.length} users in database`);
  
  const users: User[] = [];
  
  for (const userRow of db.users) {
    const badges = db.badges
      .filter(b => b.user_id === userRow.id)
      .map(b => b.badge_id);
    
    users.push({
      id: userRow.id,
      email: userRow.email,
      password: userRow.password || undefined,
      name: userRow.name || undefined,
      photo: userRow.photo || undefined,
      licensePlate: userRow.license_plate,
      state: userRow.state || undefined,
      pelletCount: userRow.pellet_count,
      positivePelletCount: userRow.positive_pellet_count,
      badges,
      exp: userRow.exp,
      level: userRow.level,
      adminRole: userRow.admin_role as AdminRole,
      createdAt: new Date(userRow.created_at * 1000).toISOString(),
    });
  }
  
  return users.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'badges'>>): Promise<User> => {
  const db = getDatabase();
  
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  const user = db.users[userIndex];
  const now = Math.floor(Date.now() / 1000);
  
  if (updates.name !== undefined) {
    user.name = updates.name || null;
  }
  if (updates.photo !== undefined) {
    user.photo = updates.photo || null;
  }
  if (updates.password !== undefined) {
    user.password = updates.password || null;
  }
  if (updates.licensePlate !== undefined) {
    user.license_plate = updates.licensePlate;
  }
  if (updates.state !== undefined) {
    user.state = updates.state || null;
  }
  if (updates.pelletCount !== undefined) {
    user.pellet_count = updates.pelletCount;
  }
  if (updates.positivePelletCount !== undefined) {
    user.positive_pellet_count = updates.positivePelletCount;
  }
  if (updates.exp !== undefined) {
    user.exp = updates.exp;
  }
  if (updates.level !== undefined) {
    user.level = updates.level;
  }
  if (updates.adminRole !== undefined) {
    user.admin_role = updates.adminRole || null;
  }
  
  user.updated_at = now;
  
  return getUserById(userId);
};

export const addBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  const db = getDatabase();
  
  const existing = db.badges.find(b => b.user_id === userId && b.badge_id === badgeId);
  
  if (!existing) {
    db.badges.push({
      id: `${userId}-${badgeId}`,
      user_id: userId,
      badge_id: badgeId,
      earned_at: Math.floor(Date.now() / 1000),
    });
  }
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = getDatabase();
  
  const user = db.users.find(u => u.id === userId);
  
  if (user) {
    user.admin_role = adminRole;
    user.updated_at = Math.floor(Date.now() / 1000);
  }
};
