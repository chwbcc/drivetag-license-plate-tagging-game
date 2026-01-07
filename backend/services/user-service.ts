import { getDatabase, getAdminDatabase } from '../database';
import { User, AdminRole } from '@/types';

export const createUser = async (user: Omit<User, 'pelletCount' | 'positivePelletCount' | 'badges' | 'exp' | 'level' | 'password'>): Promise<User> => {
  console.log('[UserService] Creating user:', user.email);
  const db = getDatabase();
  
  const adminRole = user.adminRole || null;
  
  const newUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    photo: user.photo,
    licensePlate: user.licensePlate,
    state: user.state,
    pelletCount: 10,
    positivePelletCount: 5,
    positiveRatingCount: 0,
    negativeRatingCount: 0,
    pelletsGivenCount: 0,
    negativePelletsGivenCount: 0,
    positivePelletsGivenCount: 0,
    badges: [],
    exp: 0,
    level: 1,
    adminRole,
    createdAt: new Date().toISOString(),
  };
  
  try {
    const { error: userError } = await db
      .from('users')
      .insert({
        id: newUser.id,
        email: newUser.email,
        username: newUser.name || 'Anonymous',
        created_at: Date.now(),
        role: adminRole || 'user',
        license_plate: newUser.licensePlate || null,
        state: newUser.state || null,
        experience: newUser.exp,
        level: newUser.level,
        name: newUser.name || '',
        photo: newUser.photo || null,
        negative_pellet_count: newUser.pelletCount,
        positive_pellet_count: newUser.positivePelletCount,
        positive_rating_count: newUser.positiveRatingCount,
        negative_rating_count: newUser.negativeRatingCount,
        badges: JSON.stringify(newUser.badges),
      });
    
    if (userError) {
      console.error('❌ Database insert error (users):', userError);
      console.error('❌ Error details:', JSON.stringify({
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint
      }, null, 2));
      throw userError;
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
  
  const user: User = {
    id: data.id as string,
    email: data.email as string,
    name: (data.name as string) || '',
    photo: data.photo as string | undefined,
    licensePlate: (data.license_plate as string) || (data.licenseplate as string) || '',
    state: (data.state as string) || '',
    pelletCount: (data.negative_pellet_count as number) || 0,
    positivePelletCount: (data.positive_pellet_count as number) || 0,
    positiveRatingCount: (data.positive_rating_count as number) || 0,
    negativeRatingCount: (data.negative_rating_count as number) || 0,
    pelletsGivenCount: (data.pellets_given_count as number) || 0,
    negativePelletsGivenCount: (data.negative_pellets_given_count as number) || 0,
    positivePelletsGivenCount: (data.positive_pellets_given_count as number) || 0,
    badges: typeof data.badges === 'string' ? JSON.parse(data.badges) : (data.badges || []),
    exp: (data.experience as number) || 0,
    level: (data.level as number) || 1,
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
  
  const user: User = {
    id: data.id as string,
    email: data.email as string,
    name: (data.name as string) || '',
    photo: data.photo as string | undefined,
    licensePlate: (data.license_plate as string) || (data.licenseplate as string) || '',
    state: (data.state as string) || '',
    pelletCount: (data.negative_pellet_count as number) || 0,
    positivePelletCount: (data.positive_pellet_count as number) || 0,
    positiveRatingCount: (data.positive_rating_count as number) || 0,
    negativeRatingCount: (data.negative_rating_count as number) || 0,
    pelletsGivenCount: (data.pellets_given_count as number) || 0,
    negativePelletsGivenCount: (data.negative_pellets_given_count as number) || 0,
    positivePelletsGivenCount: (data.positive_pellets_given_count as number) || 0,
    badges: typeof data.badges === 'string' ? JSON.parse(data.badges) : (data.badges || []),
    exp: (data.experience as number) || 0,
    level: (data.level as number) || 1,
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
    return {
      id: row.id as string,
      email: row.email as string,
      name: (row.name as string) || '',
      photo: row.photo as string | undefined,
      licensePlate: (row.license_plate as string) || (row.licenseplate as string) || '',
      state: (row.state as string) || '',
      pelletCount: (row.negative_pellet_count as number) || 0,
      positivePelletCount: (row.positive_pellet_count as number) || 0,
      positiveRatingCount: (row.positive_rating_count as number) || 0,
      negativeRatingCount: (row.negative_rating_count as number) || 0,
      pelletsGivenCount: (row.pellets_given_count as number) || 0,
      negativePelletsGivenCount: (row.negative_pellets_given_count as number) || 0,
      positivePelletsGivenCount: (row.positive_pellets_given_count as number) || 0,
      badges: typeof row.badges === 'string' ? JSON.parse(row.badges) : (row.badges || []),
      exp: (row.experience as number) || 0,
      level: (row.level as number) || 1,
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
  
  const { error } = await db
    .from('users')
    .update({
      username: updatedUser.name,
      name: updatedUser.name,
      photo: updatedUser.photo || null,
      role: updatedUser.adminRole || 'user',
      license_plate: updatedUser.licensePlate || null,
      state: updatedUser.state || null,
      experience: updatedUser.exp,
      level: updatedUser.level,
      negative_pellet_count: updatedUser.pelletCount,
      positive_pellet_count: updatedUser.positivePelletCount,
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
        userid: userId,
        badgeid: badgeId,
        earned_at: Date.now(),
      });
    
    if (badgeError) throw badgeError;
    
    const { error: updateError } = await db
      .from('users')
      .update({ badges: JSON.stringify(user.badges) })
      .eq('id', userId);
    
    if (updateError) throw updateError;
  }
  
  console.log('[UserService] Added badge to user:', userId, badgeId);
};

export const updateUserAdminRole = async (userId: string, adminRole: AdminRole): Promise<void> => {
  const db = getDatabase();
  
  const { error } = await db
    .from('users')
    .update({ role: adminRole || 'user' })
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
    
    console.log('[UserService] Updating user pellet counts in database...');
    const { error } = await db
      .from('users')
      .update({ 
        negative_pellet_count: pelletCount,
        positive_pellet_count: positivePelletCount,
      })
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
    
    console.log('[UserService] Updating user experience in database...');
    const { error } = await db
      .from('users')
      .update({ 
        experience: updatedUser.exp,
        level: updatedUser.level,
      })
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
    .select('badgeid')
    .eq('userid', userId)
    .order('earned_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map((row: any) => row.badgeid as string);
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
    const user: User = {
      id: row.id as string,
      email: row.email as string,
      name: (row.name as string) || '',
      photo: row.photo as string | undefined,
      licensePlate: (row.license_plate as string) || (row.licenseplate as string) || '',
      state: (row.state as string) || '',
      pelletCount: (row.negative_pellet_count as number) || 0,
      positivePelletCount: (row.positive_pellet_count as number) || 0,
      positiveRatingCount: (row.positive_rating_count as number) || 0,
      negativeRatingCount: (row.negative_rating_count as number) || 0,
      pelletsGivenCount: (row.pellets_given_count as number) || 0,
      negativePelletsGivenCount: (row.negative_pellets_given_count as number) || 0,
      positivePelletsGivenCount: (row.positive_pellets_given_count as number) || 0,
      badges: typeof row.badges === 'string' ? JSON.parse(row.badges) : (row.badges || []),
      exp: (row.experience as number) || 0,
      level: (row.level as number) || 1,
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
    .ilike('license_plate', normalizedPlate)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  const user: User = {
    id: data.id as string,
    email: data.email as string,
    name: (data.name as string) || '',
    photo: data.photo as string | undefined,
    licensePlate: (data.license_plate as string) || (data.licenseplate as string) || '',
    state: (data.state as string) || '',
    pelletCount: (data.negative_pellet_count as number) || 0,
    positivePelletCount: (data.positive_pellet_count as number) || 0,
    positiveRatingCount: (data.positive_rating_count as number) || 0,
    negativeRatingCount: (data.negative_rating_count as number) || 0,
    pelletsGivenCount: (data.pellets_given_count as number) || 0,
    negativePelletsGivenCount: (data.negative_pellets_given_count as number) || 0,
    positivePelletsGivenCount: (data.positive_pellets_given_count as number) || 0,
    badges: typeof data.badges === 'string' ? JSON.parse(data.badges) : (data.badges || []),
    exp: (data.experience as number) || 0,
    level: (data.level as number) || 1,
    adminRole: (data.role as AdminRole) || null,
    createdAt: new Date(data.created_at as number).toISOString(),
  };
  
  return user;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const adminDb = getAdminDatabase();
  
  console.log('[UserService] Deleting user:', userId);
  console.log('[UserService] Using admin database for deletion');
  
  const { data: badgesData, error: badgesError } = await adminDb
    .from('badges')
    .delete()
    .eq('userid', userId)
    .select();
  
  if (badgesError) {
    console.error('[UserService] Error deleting user badges:', badgesError);
  } else {
    console.log(`[UserService] Deleted ${badgesData?.length || 0} badges`);
  }
  
  const { data: pelletsData, error: pelletsError } = await adminDb
    .from('pellets')
    .delete()
    .or(`createdby.eq.${userId},targetuserid.eq.${userId}`)
    .select();
  
  if (pelletsError) {
    console.error('[UserService] Error deleting user pellets:', pelletsError);
  } else {
    console.log(`[UserService] Deleted ${pelletsData?.length || 0} pellets`);
  }
  
  const { data: activitiesData, error: activitiesError } = await adminDb
    .from('activities')
    .delete()
    .eq('userid', userId)
    .select();
  
  if (activitiesError) {
    console.error('[UserService] Error deleting user activities:', activitiesError);
  } else {
    console.log(`[UserService] Deleted ${activitiesData?.length || 0} activities`);
  }
  
  const { data: userData, error: userError } = await adminDb
    .from('users')
    .delete()
    .eq('id', userId)
    .select();
  
  if (userError) {
    console.error('[UserService] Error deleting user:', userError);
    throw userError;
  }
  
  if (!userData || userData.length === 0) {
    console.error('[UserService] User was not deleted - user may not exist');
    throw new Error('User was not deleted. The user may not exist.');
  }
  
  console.log('[UserService] User deleted successfully:', userId);
};
