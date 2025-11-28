import { getDatabase, type DBActivity } from '../database';

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
  const db = getDatabase();
  
  return db.user_activity
    .filter(a => a.user_id === userId)
    .map(r => ({
      id: r.id,
      userId: r.user_id,
      actionType: r.action_type,
      actionData: r.action_data ? JSON.parse(r.action_data) : null,
      createdAt: r.created_at,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};

export const getAllUserActivity = async (limit = 100): Promise<UserActivity[]> => {
  const db = getDatabase();
  
  return db.user_activity
    .map(r => ({
      id: r.id,
      userId: r.user_id,
      actionType: r.action_type,
      actionData: r.action_data ? JSON.parse(r.action_data) : null,
      createdAt: r.created_at,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};
