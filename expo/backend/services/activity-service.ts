import { getDatabase } from '../database';

export interface UserActivity {
  id: string;
  userId: string;
  actionType: string;
  actionData: any;
  createdAt: number;
}

export const logUserActivity = async (
  userId: string,
  actionType: string,
  actionData?: any
): Promise<void> => {
  const db = getDatabase();
  
  const id = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const { error } = await db
    .from('activities')
    .insert({
      id,
      userId,
      actionType,
      actionData: JSON.stringify(actionData || {}),
      created_at: Date.now(),
    });
  
  if (error) throw error;
  
  console.log('[ActivityService] Logged user activity:', actionType, userId);
};

export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('activities')
    .select('*')
    .eq('userId', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  const activities: UserActivity[] = (data || []).map((row: any) => ({
    id: row.id as string,
    userId: row.userId as string,
    actionType: row.actionType as string,
    actionData: JSON.parse(row.actionData as string),
    createdAt: row.created_at as number,
  }));
  
  return activities;
};

export const getAllUserActivity = async (limit = 100): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  const activities: UserActivity[] = (data || []).map((row: any) => ({
    id: row.id as string,
    userId: row.userId as string,
    actionType: row.actionType as string,
    actionData: JSON.parse(row.actionData as string),
    createdAt: row.created_at as number,
  }));
  
  return activities;
};
