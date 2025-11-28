import { getDatabase, DBActivity } from '../database';

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
  const db = await getDatabase();
  
  const id = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const dataJson = actionData ? JSON.stringify(actionData) : null;
  
  const activity: DBActivity = {
    id,
    user_id: userId,
    action_type: actionType,
    action_data: dataJson,
    created_at: Math.floor(Date.now() / 1000),
  };
  
  db.user_activity.push(activity);
};

export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  const db = await getDatabase();
  
  const rows = db.user_activity
    .filter(a => a.user_id === userId)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    actionData: row.action_data ? JSON.parse(row.action_data) : null,
    createdAt: row.created_at,
  }));
};

export const getAllUserActivity = async (limit = 100): Promise<UserActivity[]> => {
  const db = await getDatabase();
  
  const rows = [...db.user_activity]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    actionData: row.action_data ? JSON.parse(row.action_data) : null,
    createdAt: row.created_at,
  }));
};
