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
  const db = await getDatabase();
  
  const id = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const dataJson = actionData ? JSON.stringify(actionData) : null;
  
  await db.runAsync(
    `INSERT INTO user_activity (id, user_id, action_type, action_data)
     VALUES (?, ?, ?, ?)`,
    [id, userId, actionType, dataJson]
  );
};

export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  const db = await getDatabase();
  
  const rows = await db.getAllAsync<{
    id: string;
    user_id: string;
    action_type: string;
    action_data: string | null;
    created_at: number;
  }>(
    'SELECT * FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  
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
  
  const rows = await db.getAllAsync<{
    id: string;
    user_id: string;
    action_type: string;
    action_data: string | null;
    created_at: number;
  }>(
    'SELECT * FROM user_activity ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    actionData: row.action_data ? JSON.parse(row.action_data) : null,
    createdAt: row.created_at,
  }));
};
