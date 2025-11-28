import { getDatabase, type DBUser } from '../database';
import { User, AdminRole } from '@/types';

export const createUser = async (user: Omit<User, 'pelletCount' | 'positivePelletCount' | 'badges' | 'exp' | 'level'>): Promise<User> => {
  const db = getDatabase();
  
  const adminRole = user.adminRole || null;
  
  console.log('[UserService] Creating user:', { id: user.id, email: user.email, adminRole });
  
  const now = Math.floor(Date.now() / 1000);
  
  await db.execute({
    sql: `
      INSERT INTO users (
        id, email, password, name, photo, license_plate, state, 
        admin_role, pellet_count, positive_pellet_count, exp, level, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, ?, ?)
    `,
    args: [
      user.id,
      user.email,
      user.password || null,
      user.name || null,
      user.photo || null,
      user.licensePlate,
      user.state || null,
      adminRole,
      now,
      now
    ]
  });
  
  console.log('[UserService] User created successfully');
  
  return getUserById(user.id);
};

export const getUserById = async (userId: string): Promise<User> => {
  const db = getDatabase();
  
  const userResult = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId]
  });
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userRow = userResult.rows[0] as unknown as DBUser;
  
  const badgeResult = await db.execute({
    sql: 'SELECT badge_id FROM badges WHERE user_id = ?',
    args: [userId]
  });
  
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
    badges: badgeResult.rows.map(r => (r as any).badge_id as string),
    exp: userRow.exp,
    level: userRow.level,
    adminRole: userRow.admin_role as AdminRole,
    createdAt: new Date(userRow.created_at * 1000).toISOString(),
  };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  
  const userResult = await db.execute({
    sql: 'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
    args: [email]
  });
  
  if (userResult.rows.length === 0) {
    return null;
  }
  
  const userRow = userResult.rows[0] as unknown as DBUser;
  
  const badgeResult = await db.execute({
    sql: 'SELECT badge_id FROM badges WHERE user_id = ?',
    args: [userRow.id]
  });
  
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
    badges: badgeResult.rows.map(r => (r as any).badge_id as string),
    exp: userRow.exp,
    level: userRow.level,
    adminRole: userRow.admin_role as AdminRole,
    createdAt: new Date(userRow.created_at * 1000).toISOString(),
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  
  const userResult = await db.execute('SELECT * FROM users ORDER BY created_at DESC');
  
  console.log(`[UserService] Found ${userResult.rows.length} users in database`);
  
  const users: User[] = [];
  
  for (const row of userResult.rows) {
    const userRow = row as unknown as DBUser;
    
    const badgeResult = await db.execute({
      sql: 'SELECT badge_id FROM badges WHERE user_id = ?',
      args: [userRow.id]
    });
    
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
      badges: badgeResult.rows.map(r => (r as any).badge_id as string),
      exp: userRow.exp,
      level: userRow.level,
      adminRole: userRow.admin_role as AdminRole,
      createdAt: new Date(userRow.created_at * 1000).toISOString(),
    });
  }
  
  return users;
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'badges'>>): Promise<User> => {
  const db = getDatabase();
  
  const setParts: string[] = [];
  const args: any[] = [];
  
  if (updates.name !== undefined) {
    setParts.push('name = ?');
    args.push(updates.name || null);
  }
  if (updates.photo !== undefined) {
    setParts.push('photo = ?');
    args.push(updates.photo || null);
  }
  if (updates.password !== undefined) {
    setParts.push('password = ?');
    args.push(updates.password || null);
  }
  if (updates.licensePlate !== undefined) {
    setParts.push('license_plate = ?');
    args.push(updates.licensePlate);
  }
  if (updates.state !== undefined) {
    setParts.push('state = ?');
    args.push(updates.state || null);
  }
  if (updates.pelletCount !== undefined) {
    setParts.push('pellet_count = ?');
    args.push(updates.pelletCount);
  }
  if (updates.positivePelletCount !== undefined) {
    setParts.push('positive_pellet_count = ?');
    args.push(updates.positivePelletCount);
  }
  if (updates.exp !== undefined) {
    setParts.push('exp = ?');
    args.push(updates.exp);
  }
  if (updates.level !== undefined) {
    setParts.push('level = ?');
    args.push(updates.level);
  }
  if (updates.adminRole !== undefined) {
    setParts.push('admin_role = ?');
    args.push(updates.adminRole || null);
  }
  
  if (setParts.length > 0) {
    setParts.push('updated_at = ?');
    args.push(Math.floor(Date.now() / 1000));
    args.push(userId);
    
    await db.execute({
      sql: `UPDATE users SET ${setParts.join(', ')} WHERE id = ?`,
      args
    });
  }
  
  return getUserById(userId);
};

export const addBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  const db = getDatabase();
  
  const existingResult = await db.execute({
    sql: 'SELECT id FROM badges WHERE user_id = ? AND badge_id = ?',
    args: [userId, badgeId]
  });
  
  if (existingResult.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO badges (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, ?)',
      args: [
        `${userId}-${badgeId}`,
        userId,
        badgeId,
        Math.floor(Date.now() / 1000)
      ]
    });
  }
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = getDatabase();
  
  await db.execute({
    sql: 'UPDATE users SET admin_role = ?, updated_at = ? WHERE id = ?',
    args: [adminRole, Math.floor(Date.now() / 1000), userId]
  });
};
