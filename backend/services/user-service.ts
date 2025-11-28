import { getDatabase } from '../database';
import { User, AdminRole } from '@/types';

export const createUser = async (user: Omit<User, 'pelletCount' | 'positivePelletCount' | 'badges' | 'exp' | 'level'>): Promise<User> => {
  console.log('[UserService] Creating user:', user.email);
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
  
  const stats = JSON.stringify({
    pelletCount: newUser.pelletCount,
    positivePelletCount: newUser.positivePelletCount,
    badges: newUser.badges,
    exp: newUser.exp,
    level: newUser.level,
    name: newUser.name,
    photo: newUser.photo,
    licensePlate: newUser.licensePlate,
    state: newUser.state,
  });
  
  try {
    await db.execute({
      sql: 'INSERT INTO users (id, email, username, passwordHash, createdAt, stats, role, licensePlate, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        newUser.id,
        newUser.email,
        newUser.name || 'Anonymous',
        newUser.password,
        Date.now(),
        stats,
        adminRole || 'user',
        newUser.licensePlate || null,
        newUser.state || null
      ] as any[]
    });
    
    console.log('[UserService] Created user:', newUser.email);
    return newUser;
  } catch (error: any) {
    console.error('[UserService] Error creating user:', error);
    console.error('[UserService] Error details:', {
      message: error?.message,
      code: error?.code,
    });
    throw new Error(`Failed to create user: ${error?.message || 'Unknown error'}`);
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  const db = getDatabase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId]
  });
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const row = result.rows[0];
  const stats = JSON.parse(row.stats as string);
  
  const user: User = {
    id: row.id as string,
    email: row.email as string,
    password: row.passwordHash as string,
    name: stats.name || '',
    photo: stats.photo,
    licensePlate: (row.licensePlate as string) || stats.licensePlate || '',
    state: (row.state as string) || stats.state || '',
    pelletCount: stats.pelletCount || 0,
    positivePelletCount: stats.positivePelletCount || 0,
    badges: stats.badges || [],
    exp: stats.exp || 0,
    level: stats.level || 1,
    adminRole: (row.role as AdminRole) || null,
    createdAt: new Date(row.createdAt as number).toISOString(),
  };
  
  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  
  const normalizedEmail = email.toLowerCase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
    args: [normalizedEmail]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  const stats = JSON.parse(row.stats as string);
  
  const user: User = {
    id: row.id as string,
    email: row.email as string,
    password: row.passwordHash as string,
    name: stats.name || '',
    photo: stats.photo,
    licensePlate: (row.licensePlate as string) || stats.licensePlate || '',
    state: (row.state as string) || stats.state || '',
    pelletCount: stats.pelletCount || 0,
    positivePelletCount: stats.positivePelletCount || 0,
    badges: stats.badges || [],
    exp: stats.exp || 0,
    level: stats.level || 1,
    adminRole: (row.role as AdminRole) || null,
    createdAt: new Date(row.createdAt as number).toISOString(),
  };
  
  return user;
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  
  const result = await db.execute('SELECT * FROM users ORDER BY createdAt DESC');
  
  const users: User[] = result.rows.map(row => {
    const stats = JSON.parse(row.stats as string);
    
    return {
      id: row.id as string,
      email: row.email as string,
      password: row.passwordHash as string,
      name: stats.name || '',
      photo: stats.photo,
      licensePlate: (row.licensePlate as string) || stats.licensePlate || '',
      state: (row.state as string) || stats.state || '',
      pelletCount: stats.pelletCount || 0,
      positivePelletCount: stats.positivePelletCount || 0,
      badges: stats.badges || [],
      exp: stats.exp || 0,
      level: stats.level || 1,
      adminRole: (row.role as AdminRole) || null,
      createdAt: new Date(row.createdAt as number).toISOString(),
    };
  });
  
  return users;
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'badges'>>): Promise<User> => {
  const db = getDatabase();
  
  const user = await getUserById(userId);
  
  const updatedUser: User = {
    ...user,
    ...updates,
    id: user.id,
    email: user.email,
  };
  
  const stats = JSON.stringify({
    pelletCount: updatedUser.pelletCount,
    positivePelletCount: updatedUser.positivePelletCount,
    badges: updatedUser.badges,
    exp: updatedUser.exp,
    level: updatedUser.level,
    name: updatedUser.name,
    photo: updatedUser.photo,
    licensePlate: updatedUser.licensePlate,
    state: updatedUser.state,
  });
  
  await db.execute({
    sql: 'UPDATE users SET username = ?, passwordHash = ?, stats = ?, role = ?, licensePlate = ?, state = ? WHERE id = ?',
    args: [
      updatedUser.name,
      updatedUser.password,
      stats,
      updatedUser.adminRole || 'user',
      updatedUser.licensePlate || null,
      updatedUser.state || null,
      userId
    ] as any[]
  });
  
  console.log('[UserService] Updated user:', userId);
  return updatedUser;
};

export const addBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  const db = getDatabase();
  
  const user = await getUserById(userId);
  
  if (!user.badges) {
    user.badges = [];
  }
  
  if (!user.badges.includes(badgeId)) {
    user.badges.push(badgeId);
    
    await db.execute({
      sql: 'INSERT INTO badges (id, userId, badgeId, earnedAt) VALUES (?, ?, ?, ?)',
      args: [`${userId}-${badgeId}`, userId, badgeId, Date.now()]
    });
    
    const stats = JSON.stringify({
      pelletCount: user.pelletCount,
      positivePelletCount: user.positivePelletCount,
      badges: user.badges,
      exp: user.exp,
      level: user.level,
      name: user.name,
      photo: user.photo,
      licensePlate: user.licensePlate,
      state: user.state,
    });
    
    await db.execute({
      sql: 'UPDATE users SET stats = ? WHERE id = ?',
      args: [stats, userId]
    });
  }
  
  console.log('[UserService] Added badge to user:', userId, badgeId);
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = getDatabase();
  
  await db.execute({
    sql: 'UPDATE users SET role = ? WHERE id = ?',
    args: [adminRole, userId] as any[]
  });
  
  console.log('[UserService] Updated user admin role:', userId, adminRole);
};
