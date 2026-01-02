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
    const { error } = await db
      .from('users')
      .insert({
        id: newUser.id,
        email: newUser.email,
        username: newUser.name || 'Anonymous',
        passwordHash: newUser.password,
        created_at: Date.now(),
        stats,
        role: adminRole || 'user',
        licensePlate: newUser.licensePlate || null,
        state: newUser.state || null,
      });
    
    if (error) {
      console.error('❌ Database insert error:', error);
      console.error('❌ Error details:', JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }, null, 2));
      throw error;
    }
    
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
  
  console.log('[UserService] Fetching user by ID:', userId);
  
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('[UserService] User not found with ID:', userId, error);
    throw new Error(`User not found: ${userId}`);
  }
  
  const stats = JSON.parse(data.stats as string);
  
  const user: User = {
    id: data.id as string,
    email: data.email as string,
    password: data.passwordHash as string,
    name: stats.name || '',
    photo: stats.photo,
    licensePlate: (data.licensePlate as string) || stats.licensePlate || '',
    state: (data.state as string) || stats.state || '',
    pelletCount: stats.pelletCount || 0,
    positivePelletCount: stats.positivePelletCount || 0,
    badges: stats.badges || [],
    exp: stats.exp || 0,
    level: stats.level || 1,
    adminRole: (data.role as AdminRole) || null,
    createdAt: new Date(data.created_at as number).toISOString(),
  };
  
  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  
  const normalizedEmail = email.toLowerCase();
  
  const { data, error } = await db
    .from('users')
    .select('*')
    .ilike('email', normalizedEmail)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  const stats = JSON.parse(data.stats as string);
  
  const user: User = {
    id: data.id as string,
    email: data.email as string,
    password: data.passwordHash as string,
    name: stats.name || '',
    photo: stats.photo,
    licensePlate: (data.licensePlate as string) || stats.licensePlate || '',
    state: (data.state as string) || stats.state || '',
    pelletCount: stats.pelletCount || 0,
    positivePelletCount: stats.positivePelletCount || 0,
    badges: stats.badges || [],
    exp: stats.exp || 0,
    level: stats.level || 1,
    adminRole: (data.role as AdminRole) || null,
    createdAt: new Date(data.created_at as number).toISOString(),
  };
  
  return user;
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  
  console.log('[UserService] Fetching all users...');
  const { data, error } = await db
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[UserService] Error fetching all users:', error);
    throw error;
  }
  
  console.log(`[UserService] Found ${data?.length || 0} users`);
  const users: User[] = (data || []).map((row: any) => {
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
      createdAt: new Date(row.created_at as number).toISOString(),
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
  
  const { error } = await db
    .from('users')
    .update({
      username: updatedUser.name,
      passwordHash: updatedUser.password,
      stats,
      role: updatedUser.adminRole || 'user',
      licensePlate: updatedUser.licensePlate || null,
      state: updatedUser.state || null,
    })
    .eq('id', userId);
  
  if (error) throw error;
  
  console.log('[UserService] Updated user:', userId);
  return updatedUser;
};

export const addBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  const db = getDatabase();
  
  console.log('[UserService] Adding badge to user:', userId, badgeId);
  console.log('[UserService] Database initialized:', !!db);
  
  const user = await getUserById(userId);
  console.log('[UserService] User found:', user.email);
  
  if (!user.badges) {
    user.badges = [];
  }
  
  if (!user.badges.includes(badgeId)) {
    user.badges.push(badgeId);
    
    const { error: badgeError } = await db
      .from('badges')
      .insert({
        id: `${userId}-${badgeId}`,
        userId,
        badgeId,
        earned_at: Date.now(),
      });
    
    if (badgeError) throw badgeError;
    
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
    
    const { error: updateError } = await db
      .from('users')
      .update({ stats })
      .eq('id', userId);
    
    if (updateError) throw updateError;
  }
  
  console.log('[UserService] Added badge to user:', userId, badgeId);
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = getDatabase();
  
  const { error } = await db
    .from('users')
    .update({ role: adminRole })
    .eq('id', userId);
  
  if (error) throw error;
  
  console.log('[UserService] Updated user admin role:', userId, adminRole);
};

export const updateUserPelletCount = async (
  userId: string, 
  pelletCount: number, 
  positivePelletCount: number
): Promise<User> => {
  try {
    const db = getDatabase();
    
    console.log('[UserService] Fetching user for pellet count update:', userId);
    console.log('[UserService] Database initialized:', !!db);
    
    const user = await getUserById(userId);
    console.log('[UserService] User found:', user.email);
    
    const updatedUser: User = {
      ...user,
      pelletCount,
      positivePelletCount,
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
    
    console.log('[UserService] Updating user pellet counts in database...');
    const { error } = await db
      .from('users')
      .update({ stats })
      .eq('id', userId);
    
    if (error) throw error;
    
    console.log('[UserService] Updated user pellet counts successfully:', userId);
    return updatedUser;
  } catch (error: any) {
    console.error('[UserService] Error updating user pellet count:', error);
    console.error('[UserService] Error details:', {
      message: error?.message,
      code: error?.code,
    });
    throw error;
  }
};

export const updateUserExperience = async (
  userId: string, 
  exp: number, 
  level: number
): Promise<User> => {
  try {
    const db = getDatabase();
    
    console.log('[UserService] Fetching user for experience update:', userId);
    console.log('[UserService] Database initialized:', !!db);
    
    const user = await getUserById(userId);
    console.log('[UserService] User found:', user.email);
    
    const updatedUser: User = {
      ...user,
      exp,
      level,
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
    
    console.log('[UserService] Updating user experience in database...');
    const { error } = await db
      .from('users')
      .update({ stats })
      .eq('id', userId);
    
    if (error) throw error;
    
    console.log('[UserService] Updated user experience successfully:', userId, exp, level);
    return updatedUser;
  } catch (error: any) {
    console.error('[UserService] Error updating user experience:', error);
    console.error('[UserService] Error details:', {
      message: error?.message,
      code: error?.code,
    });
    throw error;
  }
};

export const getUserBadges = async (userId: string): Promise<string[]> => {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('badges')
    .select('badgeId')
    .eq('userId', userId)
    .order('earned_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map((row: any) => row.badgeId as string);
};

export const getUsersByIds = async (userIds: string[]): Promise<Map<string, User>> => {
  const db = getDatabase();
  
  if (userIds.length === 0) {
    return new Map();
  }
  
  console.log(`[UserService] Fetching ${userIds.length} users by IDs...`);
  const { data, error } = await db
    .from('users')
    .select('*')
    .in('id', userIds);
  
  if (error) {
    console.error('[UserService] Error fetching users by IDs:', error);
    throw error;
  }
  
  const userMap = new Map<string, User>();
  
  (data || []).forEach((row: any) => {
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
      createdAt: new Date(row.created_at as number).toISOString(),
    };
    
    userMap.set(user.id, user);
  });
  
  console.log(`[UserService] Fetched ${userMap.size} users`);
  return userMap;
};

export const getUserByLicensePlate = async (licensePlate: string): Promise<User | null> => {
  const db = getDatabase();
  
  const normalizedPlate = licensePlate.toLowerCase();
  
  const { data, error } = await db
    .from('users')
    .select('*')
    .ilike('licensePlate', normalizedPlate)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  const stats = JSON.parse(data.stats as string);
  
  const user: User = {
    id: data.id as string,
    email: data.email as string,
    password: data.passwordHash as string,
    name: stats.name || '',
    photo: stats.photo,
    licensePlate: (data.licensePlate as string) || stats.licensePlate || '',
    state: (data.state as string) || stats.state || '',
    pelletCount: stats.pelletCount || 0,
    positivePelletCount: stats.positivePelletCount || 0,
    badges: stats.badges || [],
    exp: stats.exp || 0,
    level: stats.level || 1,
    adminRole: (data.role as AdminRole) || null,
    createdAt: new Date(data.created_at as number).toISOString(),
  };
  
  return user;
};
