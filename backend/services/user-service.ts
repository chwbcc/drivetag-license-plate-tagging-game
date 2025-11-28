import { getDatabase } from '../database';
import { User, AdminRole } from '@/types';

export const createUser = async (user: Omit<User, 'pelletCount' | 'positivePelletCount' | 'badges' | 'exp' | 'level'>): Promise<User> => {
  const db = await getDatabase();
  
  const adminRole = user.adminRole || null;
  
  await db.runAsync(
    `INSERT INTO users (id, email, password, name, photo, license_plate, state, admin_role, pellet_count, positive_pellet_count, exp, level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1)`,
    [user.id, user.email, user.password || null, user.name || null, user.photo || null, user.licensePlate, user.state || null, adminRole]
  );
  
  return getUserById(user.id);
};

export const getUserById = async (userId: string): Promise<User> => {
  const db = await getDatabase();
  
  const userRow = await db.getFirstAsync<{
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
    admin_role: AdminRole;
    created_at: number;
  }>('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!userRow) {
    throw new Error('User not found');
  }
  
  const badgeRows = await db.getAllAsync<{ badge_id: string }>(
    'SELECT badge_id FROM badges WHERE user_id = ?',
    [userId]
  );
  
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
    badges: badgeRows.map(b => b.badge_id),
    exp: userRow.exp,
    level: userRow.level,
    adminRole: userRow.admin_role,
    createdAt: new Date(userRow.created_at * 1000).toISOString(),
  };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = await getDatabase();
  
  const userRow = await db.getFirstAsync<{
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
    admin_role: AdminRole;
    created_at: number;
  }>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  
  if (!userRow) {
    return null;
  }
  
  const badgeRows = await db.getAllAsync<{ badge_id: string }>(
    'SELECT badge_id FROM badges WHERE user_id = ?',
    [userRow.id]
  );
  
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
    badges: badgeRows.map(b => b.badge_id),
    exp: userRow.exp,
    level: userRow.level,
    adminRole: userRow.admin_role,
    createdAt: new Date(userRow.created_at * 1000).toISOString(),
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = await getDatabase();
  
  const userRows = await db.getAllAsync<{
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
    admin_role: AdminRole;
    created_at: number;
  }>('SELECT * FROM users ORDER BY created_at DESC');
  
  const users: User[] = [];
  
  for (const userRow of userRows) {
    const badgeRows = await db.getAllAsync<{ badge_id: string }>(
      'SELECT badge_id FROM badges WHERE user_id = ?',
      [userRow.id]
    );
    
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
      badges: badgeRows.map(b => b.badge_id),
      exp: userRow.exp,
      level: userRow.level,
      adminRole: userRow.admin_role,
      createdAt: new Date(userRow.created_at * 1000).toISOString(),
    });
  }
  
  return users;
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'badges'>>): Promise<User> => {
  const db = await getDatabase();
  
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  
  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(updates.name || null);
  }
  if (updates.photo !== undefined) {
    updateFields.push('photo = ?');
    updateValues.push(updates.photo || null);
  }
  if (updates.password !== undefined) {
    updateFields.push('password = ?');
    updateValues.push(updates.password || null);
  }
  if (updates.licensePlate !== undefined) {
    updateFields.push('license_plate = ?');
    updateValues.push(updates.licensePlate);
  }
  if (updates.state !== undefined) {
    updateFields.push('state = ?');
    updateValues.push(updates.state || null);
  }
  if (updates.pelletCount !== undefined) {
    updateFields.push('pellet_count = ?');
    updateValues.push(updates.pelletCount);
  }
  if (updates.positivePelletCount !== undefined) {
    updateFields.push('positive_pellet_count = ?');
    updateValues.push(updates.positivePelletCount);
  }
  if (updates.exp !== undefined) {
    updateFields.push('exp = ?');
    updateValues.push(updates.exp);
  }
  if (updates.level !== undefined) {
    updateFields.push('level = ?');
    updateValues.push(updates.level);
  }
  if (updates.adminRole !== undefined) {
    updateFields.push('admin_role = ?');
    updateValues.push(updates.adminRole || null);
  }
  
  updateFields.push('updated_at = strftime("%s", "now")');
  updateValues.push(userId);
  
  if (updateFields.length > 1) {
    await db.runAsync(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }
  
  return getUserById(userId);
};

export const addBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    `INSERT OR IGNORE INTO badges (id, user_id, badge_id) VALUES (?, ?, ?)`,
    [`${userId}-${badgeId}`, userId, badgeId]
  );
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    'UPDATE users SET admin_role = ? WHERE id = ?',
    [adminRole, userId]
  );
};
